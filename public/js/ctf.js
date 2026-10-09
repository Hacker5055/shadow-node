/**
 * SHADOW NODE // CTF client hooks
 * Flag #2 lives in the developer console as a HEX packet dump.
 */

const HEX_PAYLOAD = '534e7b7034636b3374735f6e337633725f6c31337d';

export function initCtf() {
  const style = 'color:#39ff14;font-family:monospace;font-weight:bold';
  const dim = 'color:#7fa295;font-family:monospace';

  console.log('%c[SHADOW NODE] packet-dump :: 0x' + HEX_PAYLOAD, style);
  console.log(
    '%c  ▸ node daemon dropped an unparsed packet. decoders: `decrypt --hex <payload>` in the shell, or any hex tool.',
    dim
  );
  console.log('%c  ▸ submit with: flag submit SN{...}', dim);

  // debug surface (no flags here — only breadcrumbs)
  window.SHADOW_NODE = {
    version: '1.0.0',
    codename: 'SHADOW-NODE',
    clearance: 'OMEGA',
    hints: {
      dom: 'view-source: inspect the comments near the terminal markup',
      console: 'you are already here.',
      headers: 'inspect response headers of /api/anime/latest',
      shell: 'run `netstat` and read the malformed packet',
      svg: 'inspect the logo SVG — nobody validates <metadata>',
    },
    commands: 'type `help` in the terminal',
  };

  // a breadcrumb element (deliberately invisible, but present in the DOM)
  const ghost = document.createElement('div');
  ghost.setAttribute('data-node-entity', 'ghost://layer-07/unvalidated');
  ghost.style.cssText = 'position:fixed;width:0;height:0;overflow:hidden;opacity:0;pointer-events:none';
  ghost.textContent = 'layer 07 :: entity metadata is never validated';
  document.body.appendChild(ghost);
}
