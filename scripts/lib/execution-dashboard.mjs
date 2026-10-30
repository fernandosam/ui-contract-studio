/** Portable, script-free E10 dashboard. Outputs aggregate numbers, never raw events. */
import {EXECUTION_PHASES} from './execution-events.mjs';

const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;')
  .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const shown=value=>value===null||value===undefined?'N/D':esc(value);
const percentage=(value,maximum)=>maximum>0?Math.min(100,Math.max(0,value/maximum*100)):0;
const meter=(value,maximum,variant='primary')=>
  '<div class="track" aria-hidden="true"><div class="fill '+variant+'" style="width:'+
  percentage(value,maximum).toFixed(2)+'%"></div></div>';

function statusBars(report) {
  return report.series.map(point=>{
    const counts=point.operations,total=counts.total;
    const parts=[['completed','good'],['failed','bad'],['blocked','warn'],['incomplete','muted']]
      .map(([key,className])=>'<span class="'+className+'" style="width:'+
        percentage(counts[key],total).toFixed(2)+'%"></span>').join('');
    return '<div class="chart-row"><span class="period">'+esc(point.period)+'</span>'+
      '<div class="track stack" aria-hidden="true">'+parts+'</div><span class="value">'+
      esc(counts.completed)+'/'+esc(total)+'</span></div>';
  }).join('');
}

function metricBars(report,read,maxValue,suffix='') {
  return report.series.map(point=>{
    const value=read(point);
    return '<div class="chart-row"><span class="period">'+esc(point.period)+'</span>'+
      (value===null?'<span class="unknown">N/D — sem amostra</span>':meter(value,maxValue))+
      '<span class="value">'+shown(value)+(value===null?'':suffix)+'</span></div>';
  }).join('');
}
const maxKnown=(report,read)=>Math.max(0,...report.series.map(read).filter(x=>x!==null));
const section=(title,description,body)=>
  '<section class="panel"><h2>'+title+'</h2><p class="muted">'+description+'</p>'+body+'</section>';
const empty=report=>report.series.length?'':'<p class="empty">Nenhum evento observado. Métricas indisponíveis (N/D).</p>';

function phaseTable(report) {
  return '<div class="scroll"><table><thead><tr><th>Fase</th><th>Operações</th><th>Concluídas</th>'+
    '<th>Falhas</th><th>Bloqueadas</th><th>Incompletas</th><th>p95 (ms)</th></tr></thead><tbody>'+
    EXECUTION_PHASES.map(phase=>{
      const row=report.summary.byPhase[phase];
      return '<tr><th scope="row">'+esc(phase)+'</th><td>'+shown(row.total)+
        '</td><td>'+shown(row.completed)+'</td><td>'+shown(row.failed)+
        '</td><td>'+shown(row.blocked)+'</td><td>'+shown(row.incomplete)+
        '</td><td>'+shown(row.latencyMs.p95Ms)+'</td></tr>';
    }).join('')+'</tbody></table></div>';
}

function evaluationSnapshot(quality) {
  if(!quality) return '';
  return section('Qualidade contratual · avaliação independente',
    'Fotografia isolada do relatório Pi; não é série temporal e não está correlacionada aos eventos acima.',
    '<div class="stats small"><div><span>Data da evidência</span><strong>'+esc(quality.evidenceTime)+
    '</strong></div><div><span>Cenários executados</span><strong>'+shown(quality.executed)+
    '</strong></div><div><span>Não executados</span><strong>'+shown(quality.notRun)+
    '</strong></div><div><span>Aprovação final</span><strong>'+shown(quality.finalPassRatePct)+
    (quality.finalPassRatePct===null?'':'%')+'</strong></div></div>'+
    '<p class="muted">Mede somente critérios estruturais/contratuais da avaliação Pi; não certifica qualidade visual, UX, acessibilidade ou semântica.</p>');
}

export function renderExecutionTrendsHtml(report,{evaluationQuality=null}={}) {
  const summary=report.summary;
  const days=report.coverage;
  const latencyMax=maxKnown(report,p=>p.latencyMs.p95Ms);
  const tokensMax=maxKnown(report,p=>p.tokens.input.total);
  const validationRows=metricBars(report,p=>p.contractValidation.passRate,100,'%');
  const rows=report.series.map(p=>'<tr><th scope="row">'+esc(p.period)+'</th><td>'+
    p.operations.total+'</td><td>'+p.operations.completed+'</td><td>'+p.operations.failed+
    '</td><td>'+p.operations.blocked+'</td><td>'+p.operations.incomplete+'</td><td>'+
    shown(p.latencyMs.p95Ms)+'</td><td>'+shown(p.tokens.input.total)+'</td><td>'+
    shown(p.tokens.output.total)+'</td><td>'+shown(p.contractValidation.passRate)+
    '</td></tr>').join('');
  const style=[
    ':root{color-scheme:light dark;font:15px system-ui,-apple-system,sans-serif}',
    '*{box-sizing:border-box}body{margin:0;background:#0b1220;color:#f1f5f9}',
    'main{max-width:1160px;margin:auto;padding:clamp(16px,4vw,36px)}',
    'h1{font-size:clamp(25px,4vw,36px);margin:8px 0}h2{font-size:17px;margin:0 0 8px}',
    'p{line-height:1.6}.muted{color:#b5c2d5}.eyebrow{letter-spacing:.14em;text-transform:uppercase;color:#93c5fd;font-size:11px;font-weight:750}',
    '.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:22px 0}',
    '.stats>div,.panel{border:1px solid #334155;border-radius:12px;background:#172338;padding:19px}',
    '.stats strong{display:block;font-size:27px;line-height:1.5;overflow-wrap:anywhere}',
    '.stats span{color:#b5c2d5;font-size:12px}.stats.small strong{font-size:19px}',
    '.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}',
    '.panel{margin:0;min-width:0}.panel.wide{margin-top:14px}.chart-row{display:grid;grid-template-columns:96px minmax(40px,1fr) 84px;gap:12px;align-items:center;margin:13px 0}',
    '.period,.value{font:12px ui-monospace,monospace}.value{text-align:right;font-variant-numeric:tabular-nums}',
    '.track{height:17px;background:#334155;overflow:hidden;border-radius:4px;display:flex}',
    '.fill{height:100%;background:#60a5fa}.stack>span{height:100%}.good{background:#34d399}',
    '.bad{background:#fb7185}.warn{background:#fbbf24}.muted.stack{background:#94a3b8}',
    '.stack>.muted{background:#64748b}.unknown{color:#94a3b8;font-size:12px;font-style:italic}',
    '.legend{font-size:12px;display:flex;gap:14px;flex-wrap:wrap;margin:12px 0 4px;color:#cbd5e1}',
    '.dot{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px}',
    '.scroll{overflow:auto}table{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}',
    'th,td{padding:10px;border-bottom:1px solid #334155;text-align:right;white-space:nowrap}',
    'th:first-child{text-align:left}thead{color:#b5c2d5}th[scope=row]{font-weight:600}',
    '.empty{padding:26px;border:1px dashed #64748b;border-radius:10px}',
    '.notice{padding:14px 16px;border-left:3px solid #93c5fd;background:#172338;margin:16px 0}',
    'footer{font-size:12px;color:#b5c2d5;margin-top:24px}',
    '@media(max-width:760px){.grid{grid-template-columns:1fr}.chart-row{grid-template-columns:80px minmax(40px,1fr) 70px;gap:7px}.panel{padding:14px}}',
    '@media print{body{background:white;color:black}.panel,.stats>div{background:white;color:black;border-color:#aaa}.muted,.stats span,footer{color:#444}}',
  ].join('');
  return [
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; base-uri &#39;none&#39;; form-action &#39;none&#39;">',
    '<title>E10 · Tendências de execução Pi</title><style>'+style+'</style></head><body><main>',
    '<p class="eyebrow">UI Contract Studio · E10 · diagnóstico local</p><h1>Tendências de execução Pi</h1>',
    '<p class="muted">Séries em UTC, agrupamento '+esc(report.period)+'. Somente períodos observados; sem atualização automática, coleta remota ou execução do agente.</p>',
    '<div class="stats">',
    '<div><span>Operações visíveis</span><strong>'+summary.operations.total+'</strong></div>',
    '<div><span>Falhas / bloqueios</span><strong>'+summary.operations.failed+' / '+summary.operations.blocked+'</strong></div>',
    '<div><span>Incompletas / desconhecidas</span><strong>'+summary.operations.incomplete+'</strong></div>',
    '<div><span>Latência p95 (ms)</span><strong>'+shown(summary.latencyMs.p95Ms)+'</strong></div>',
    '<div><span>Tokens entrada (amostras)</span><strong>'+shown(summary.tokens.input.total)+'</strong><span>'+summary.tokens.input.samples+' amostras</span></div>',
    '</div>',
    days.olderPeriodsOmitted?'<p class="notice">Exibindo os últimos '+days.displayedPeriods+' de '+days.observedPeriods+' períodos observados. Os anteriores foram omitidos, não zerados.</p>':'',
    empty(report),
    '<div class="grid">',
    section('Resultados por período','Concluídas / total. Falhas, bloqueios e operações interrompidas permanecem distintas.',
      '<div class="legend"><span><i class="dot good"></i>Concluídas</span><span><i class="dot bad"></i>Falhas</span><span><i class="dot warn"></i>Bloqueios</span><span><i class="dot" style="background:#64748b"></i>Incompletas</span></div>'+statusBars(report)),
    section('Latência p95','Milissegundos medidos apenas em operações com início e término.',metricBars(report,p=>p.latencyMs.p95Ms,latencyMax,' ms')),
    section('Tokens reais de entrada','Soma apenas onde o Pi retornou contadores. N/D é diferente de zero.',
      metricBars(report,p=>p.tokens.input.total,tokensMax,'')+
      '<p class="muted">Amostras no período: '+report.series.map(p=>esc(p.period)+': '+p.tokens.input.samples).join(' · ')+'</p>'),
    section('Validação contratual','Taxa de validações pi:validate completas sobre concluídas + falhas; não mede UX.',validationRows),
    '</div>',
    '<div class="panel wide"><h2>Detalhamento por período</h2><p class="muted">N/D significa ausência de amostras verificáveis. Datas sem eventos não aparecem.</p>',
    '<div class="scroll"><table><thead><tr><th>Período</th><th>Total</th><th>OK</th><th>Falhas</th><th>Bloqueios</th><th>Inc.</th><th>p95 ms</th><th>Tokens entrada</th><th>Tokens saída</th><th>Validação %</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>',
    '<div class="panel wide"><h2>Fases no recorte exibido</h2>'+phaseTable(report)+'</div>',
    evaluationSnapshot(evaluationQuality),
    '<footer>Indicadores operacionais não autorizam contratos nem substituem avaliação humana, visual ou E2E. '+esc(report.qualityCaveat)+'</footer>',
    '</main></body></html>\n',
  ].join('');
}
