import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { AiCadenceRequest, AiCadenceResponse, AiEmbedResponse, AiParseRequest, AiParseResponse } from './ai.types';

/** 깨어 있는 AI는 1초 안에 답한다. 이걸 넘기면 자고 있다고 본다. */
const TIMEOUT_MS = 8_000;

/**
 * 무료 호스팅은 15분 놀면 컨테이너를 재운다. 다시 깨는 데 20초 남짓 걸려서
 * 한 번만 시도하면 '한동안 안 쓰다가 처음 하는 기록'은 매번 인식에 실패한다.
 * 첫 시도가 시간 초과나 연결 실패로 끝났을 때만 이 예산으로 한 번 더 부른다.
 */
const COLD_START_TIMEOUT_MS = 30_000;

/** 이 시간 안에 이미 깨워봤으면 다시 두드리지 않는다. */
const WARMUP_INTERVAL_MS = 5 * 60_000;

/**
 * apps/ai (FastAPI) 호출 클라이언트.
 * AI는 거들 뿐이라 실패해도 기능 전체가 멈추면 안 된다.
 * 각 메서드는 실패 시 null을 돌려주고, 호출부가 규칙 기반으로 폴백한다.
 */
@Injectable()
export class AiClient {
  private readonly logger = new Logger(AiClient.name);
  private readonly baseUrl: string;
  private readonly token: string;
  private lastWarmUpAt = 0;

  constructor(config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>('AI_SERVICE_URL').replace(/\/$/, '');
    this.token = config.getOrThrow<string>('AI_SERVICE_TOKEN');
  }

  /**
   * 잠들어 있을 AI를 미리 깨운다. 응답을 기다리지 않는다.
   *
   * 홈을 열 때 불러두면, 사용자가 문장을 말하고 누르기까지의 몇 초 동안
   * 컨테이너가 먼저 뜬다. 첫 기록에서 30초를 기다리는 일이 사실상 없어진다.
   * 실패해도 아무것도 하지 않는다 — 어차피 진짜 호출이 다시 시도한다.
   */
  warmUp(): void {
    const now = Date.now();
    if (now - this.lastWarmUpAt < WARMUP_INTERVAL_MS) return;
    this.lastWarmUpAt = now;

    fetch(`${this.baseUrl}/healthz`, { signal: AbortSignal.timeout(COLD_START_TIMEOUT_MS) }).catch(
      () => undefined,
    );
  }

  parseUtterance(body: AiParseRequest) {
    return this.post<AiParseResponse>('/v1/parse', body);
  }

  suggestCadence(body: AiCadenceRequest) {
    return this.post<AiCadenceResponse>('/v1/cadence/suggest', body);
  }

  embed(text: string) {
    return this.post<AiEmbedResponse>('/v1/embed', { text });
  }

  private async post<T>(path: string, body: unknown): Promise<T | null> {
    const first = await this.attempt<T>(path, body, TIMEOUT_MS);
    if (first.ok) return first.value;

    // 응답이 아예 없었을 때만 다시 부른다. 4xx/5xx는 다시 불러도 같은 답이다.
    if (!first.unreachable) return null;

    this.logger.log(`AI ${path} 무응답 — 깨어나길 기다리며 한 번 더 시도한다`);
    const second = await this.attempt<T>(path, body, COLD_START_TIMEOUT_MS);
    return second.ok ? second.value : null;
  }

  private async attempt<T>(
    path: string,
    body: unknown,
    timeoutMs: number,
  ): Promise<{ ok: true; value: T } | { ok: false; unreachable: boolean }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-internal-token': this.token },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        this.logger.warn(`AI ${path} responded ${res.status}`);
        return { ok: false, unreachable: false };
      }
      return { ok: true, value: (await res.json()) as T };
    } catch (err) {
      this.logger.warn(`AI ${path} failed: ${err instanceof Error ? err.message : String(err)}`);
      return { ok: false, unreachable: true };
    } finally {
      clearTimeout(timer);
    }
  }
}
