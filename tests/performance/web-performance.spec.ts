import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Scenario = {
  id: string;
  route: string;
  ready: (page: Page) => Promise<void>;
  interact: (page: Page) => Promise<void>;
};

const scenarios: Scenario[] = [
  {
    id: "reui-gallery",
    route: "/?screen=reui",
    ready: async page => { await expect(page.getByLabel("Filtrar componente")).toBeVisible(); },
    interact: async page => {
      await page.getByLabel("Filtrar componente").selectOption("Accordion");
      const search = page.getByLabel("Pesquisar exemplos");
      await search.fill("PADRAO MINIMO");
      await expect(page.getByTestId("reui-preview-c-accordion-1")).toBeVisible();
      await search.fill("");
    },
  },
  {
    id: "primitive-discovery",
    route: "/?screen=explorador-primitivos",
    ready: async page => { await expect(page.getByRole("searchbox", { name: "Buscar componente" })).toBeVisible(); },
    interact: async page => {
      const search = page.getByRole("searchbox", { name: "Buscar componente" });
      await search.fill("AlertDialog");
      await expect(page.getByLabel("Componentes registrados").getByRole("button", { name: "AlertDialog" }).first()).toBeVisible();
      await search.fill("");
    },
  },
  {
    id: "composite-preview",
    route: "/?screen=explorador-compostos",
    ready: async page => { await expect(page.getByLabel("Buscar componente")).toBeVisible(); },
    interact: async page => {
      const search = page.getByLabel("Buscar componente");
      await search.fill("Dashboard01");
      await page.getByRole("button", { name: "Dashboard01", exact: true }).click();
      await expect(page.getByTestId("catalog-live-preview")).toBeVisible();
      await search.fill("");
    },
  },
  {
    id: "json-example",
    route: "/?screen=explorador-exemplos",
    ready: async page => { await expect(page.getByLabel("Exemplo", { exact: true })).toBeVisible(); },
    interact: async page => {
      await page.getByLabel("Exemplo", { exact: true }).selectOption("blocos-login");
      await expect(page.getByTestId("catalog-live-preview")).toBeVisible();
      const filter = page.getByLabel("Filtrar nós");
      await filter.fill("Text");
      await filter.fill("");
    },
  },
  {
    id: "login-screen-theme",
    route: "/?screen=blocos-login",
    ready: async page => { await expect(page.getByRole("heading", { name: "Login", exact: true }).first()).toBeVisible(); },
    interact: async page => {
      await page.getByRole("button", { name: "Ativar tema claro" }).click();
      await expect(page.locator("html")).toHaveClass(/light-theme/);
      await page.getByRole("button", { name: "Ativar tema escuro" }).click();
      await expect(page.locator("html")).toHaveClass(/dark-theme/);
    },
  },
];

function quantile(numbers: number[], fraction: number) {
  if (!numbers.length) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const offset = (sorted.length - 1) * fraction;
  const start = Math.floor(offset);
  const share = offset - start;
  return Math.round((sorted[start] + (sorted[Math.ceil(offset)] - sorted[start]) * share) * 100) / 100;
}

async function instrument(page: Page) {
  await page.addInitScript(() => {
    const state = { lcpMs: null as number | null, cls: 0, longTaskCount: 0, longTaskMs: 0 };
    (window as typeof window & { __e11Perf?: typeof state }).__e11Perf = state;
    const observe = (type: string, onEntry: (entry: PerformanceEntry) => void) => {
      try {
        const observer = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) onEntry(entry);
        });
        observer.observe({ type, buffered: true });
      } catch { /* An unavailable browser metric is reported as null/zero, never fabricated. */ }
    };
    observe("largest-contentful-paint", entry => { state.lcpMs = entry.startTime; });
    observe("layout-shift", entry => {
      const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
      if (!shift.hadRecentInput) state.cls += shift.value ?? 0;
    });
    observe("longtask", entry => {
      state.longTaskCount++;
      state.longTaskMs += entry.duration;
    });
  });
}

async function loadMetrics(page: Page) {
  return page.evaluate(() => {
    const state = (window as typeof window & {
      __e11Perf?: { lcpMs: number | null; cls: number; longTaskCount: number; longTaskMs: number };
    }).__e11Perf;
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const paint = performance.getEntriesByType("paint")
      .find(item => item.name === "first-contentful-paint");
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const rounded = (n: number | undefined) => typeof n === "number" && Number.isFinite(n)
      ? Math.round(n * 100) / 100 : null;
    const width = document.documentElement.scrollWidth;
    return {
      domContentLoadedMs: rounded(nav?.domContentLoadedEventEnd),
      responseStartMs: rounded(nav?.responseStart),
      firstContentfulPaintMs: rounded(paint?.startTime),
      largestContentfulPaintMs: rounded(state?.lcpMs ?? undefined),
      cumulativeLayoutShift: rounded(state?.cls),
      longTasks: state?.longTaskCount ?? null,
      longTaskTotalMs: rounded(state?.longTaskMs),
      resourceEncodedBytes: resources.reduce((sum, entry) => sum + (entry.encodedBodySize || 0), 0),
      viewportWidthPx: window.innerWidth,
      documentWidthPx: width,
      horizontalOverflowPx: Math.max(0, width - window.innerWidth),
    };
  });
}

test.describe("E11 production browser performance (manual lab)", () => {
  for (const scenario of scenarios) {
    test(scenario.id, async ({ page }, testInfo) => {
      const mobile = testInfo.project.name === "mobile";
      const session = await page.context().newCDPSession(page);
      await session.send("Performance.enable");
      if (mobile) {
        await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        await session.send("Network.enable");
        await session.send("Network.emulateNetworkConditions", {
          offline: false, latency: 150, downloadThroughput: 200_000,
          uploadThroughput: 93_750, connectionType: "cellular4g",
        });
      }

      let pageErrors = 0;
      let blockedExternalRequests = 0;
      page.on("pageerror", () => { pageErrors++; });
      await page.route("**/*", route => {
        const url = new URL(route.request().url());
        if (url.hostname === "127.0.0.1" && url.port === "4173") return route.continue();
        blockedExternalRequests++;
        return route.abort();
      });
      await instrument(page);

      const navigation = [];
      for (let run = 0; run < 3; run++) {
        await page.goto(scenario.route, { waitUntil: "domcontentloaded" });
        await scenario.ready(page);
        await page.waitForTimeout(200);
        navigation.push({ run: run === 0 ? "first" : "repeat-" + run, ...await loadMetrics(page) });
      }
      const heapBytes = async () => {
        const result = await session.send("Performance.getMetrics") as { metrics: Array<{ name: string; value: number }> };
        const value = result.metrics.find(item => item.name === "JSHeapUsedSize")?.value;
        if (typeof value !== "number" || !Number.isFinite(value)) {
          throw new Error("CDP JSHeapUsedSize unavailable: memory was not measured");
        }
        return Math.round(value);
      };
      const heapBefore = await heapBytes();
      const interactions: number[] = [];
      const heapSamples: number[] = [];
      for (let index = 0; index < 5; index++) {
        const start = Date.now();
        await scenario.interact(page);
        await page.evaluate(() => new Promise<void>(resolve =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
        interactions.push(Date.now() - start);
        heapSamples.push(await heapBytes());
      }
      const report = {
        schemaVersion: 1,
        measuredAt: new Date().toISOString(),
        scenario: scenario.id,
        project: testInfo.project.name,
        profile: mobile
          ? { device: "Pixel 7 emulation", cpuThrottle: 4, latencyMs: 150, downloadBytesPerSecond: 200_000 }
          : { device: "Desktop Chrome", cpuThrottle: 1, latencyMs: 0, downloadBytesPerSecond: null },
        navigation,
        interactionAutomationWallMs: {
          samples: interactions, p50: quantile(interactions, 0.5), p95: quantile(interactions, 0.95),
        },
        javascriptHeapBytes: {
          beforeInteractions: heapBefore,
          afterEachInteraction: heapSamples,
          deltaLastMinusFirst: heapSamples.at(-1)! - heapSamples[0],
        },
        pageErrorCount: pageErrors,
        blockedExternalRequestCount: blockedExternalRequests,
      };
      const output = join("reports", "web-performance", "browser",
        testInfo.project.name + "-" + scenario.id + ".json");
      mkdirSync(join("reports", "web-performance", "browser"), { recursive: true });
      writeFileSync(output, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
      await testInfo.attach("E11 performance measurements", {
        body: Buffer.from(JSON.stringify(report)), contentType: "application/json",
      });
      // Capture only after measurement so screenshot work does not contaminate the samples.
      const screenshot = join("reports", "web-performance", "screenshots",
        testInfo.project.name + "-" + scenario.id + ".png");
      mkdirSync(join("reports", "web-performance", "screenshots"), { recursive: true });
      await page.screenshot({ path: screenshot, fullPage: false });
      await testInfo.attach("E11 measured viewport", { path: screenshot, contentType: "image/png" });
      await session.detach();
      expect(pageErrors, "Uncaught browser exceptions").toBe(0);
      expect(blockedExternalRequests, "Unexpected external requests").toBe(0);
      expect(navigation).toHaveLength(3);
    });
  }
});
