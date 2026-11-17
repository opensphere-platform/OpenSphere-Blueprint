/* 제품명 앞에 로고를 붙인다.
 * 로고 원본: logos.opl.io.kr (openplatform-labs/logos), 이 저장소 assets/logos/에 내장.
 * 코드 블록·인라인 코드·스크립트 안의 이름은 건드리지 않는다.
 * 로고를 붙이지 않을 영역은 data-nologo 속성을 단다. */
(function () {
  var me = document.currentScript;
  var base = me && me.src ? me.src.replace(/js\/logos\.js(\?.*)?$/, 'logos/') : 'assets/logos/';

  var M = {
    'Argo CD': 'argocd-icon.svg', 'Argo': 'argocd-icon.svg',
    'Kubernetes': 'kubernetes-icon.svg', 'K8s': 'kubernetes-icon.svg',
    'Crossplane': 'crossplane-icon.svg',
    'PostgreSQL': 'postgresql-icon.svg', 'Postgres': 'postgresql-icon.svg',
    'Samba': 'samba-server.svg',
    'OpenSearch': 'opensearch-icon.svg',
    'Stalwart': 'stalwart.svg',
    'Mattermost': 'mattermost-icon.svg',
    'AFFiNE': 'affine-icon.svg',
    'Odoo': 'odoo-icon.svg',
    'Keycloak': 'keycloak-icon.svg',
    'Supabase': 'supabase-wordmark-icon.svg',
    'Gitea': 'gitea-icon.svg',
    'GitLab': 'gitlab-wordmark-icon.svg',
    'GitHub': 'github-icon.svg',
    'KubeVirt': 'kubevirt.svg',
    'Temporal': 'temporal-icon.svg',
    'Dapr': 'dapr-icon.svg',
    'SpiceDB': 'spicedb-icon.svg',
    'Kyverno': 'kyverno.svg',
    'SPIRE': 'spire.svg',
    'cert-manager': 'cert-manager.svg',
    'OpenBao': 'openbao.svg',
    'Vault': 'vault-icon.svg',
    'Cilium': 'cilium-icon.svg',
    'vCluster': 'vcluster.svg',
    'Backstage': 'backstage-icon.svg',
    'Medusa': 'medusa-icon.svg',
    'ERPNext': 'erpnext-icon.svg',
    'RustFS': 'rustfs.svg',
    'Helm': 'helm-icon.svg',
    'Kafka': 'kafka-icon.svg',
    'NATS': 'nats-icon.svg',
    'AWS': 'aws-icon.svg',
    'Azure': 'azure-icon.svg',
    'Google Cloud': 'google-cloud-icon.svg',
    'OpenTelemetry': 'opentelemetry-icon.svg',
    'Valkey': 'valkey.svg',
    'Velero': 'velero.svg',
    'Longhorn': 'longhorn-icon.svg',
    'Directus': 'directus-icon.svg',
    'Linkerd': 'linkerd-icon.svg',
    'Docker': 'docker-wordmark-icon.svg',
    'Dolibarr': 'dolibarr-icon.svg',
    'OpenClaw': 'openclaw.svg',
    'Prometheus': 'prometheus-icon.svg',
    'Grafana': 'grafana-icon.svg',
    'Rancher': 'rancher-icon.svg',
    'NGINX': 'nginx-icon.svg', 'Nginx': 'nginx-icon.svg',
    'Percona': 'percona.svg'
  };

  function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  var names = Object.keys(M).sort(function (a, b) { return b.length - a.length; });
  var re = new RegExp('(?<![A-Za-z0-9_\\-./])(' + names.map(esc).join('|') + ')(?![A-Za-z0-9_])', 'g');
  var SKIP = { PRE: 1, CODE: 1, KBD: 1, SAMP: 1, SCRIPT: 1, STYLE: 1, TEXTAREA: 1, TITLE: 1, svg: 1, SVG: 1 };

  function skip(node) {
    for (var el = node.parentNode; el && el.nodeType === 1; el = el.parentNode) {
      if (SKIP[el.nodeName] || el.hasAttribute('data-nologo')) return true;
    }
    return false;
  }

  function apply(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var targets = [];
    for (var n = walker.nextNode(); n; n = walker.nextNode()) {
      re.lastIndex = 0;
      if (re.test(n.nodeValue) && !skip(n)) targets.push(n);
    }
    targets.forEach(function (t) {
      var text = t.nodeValue, frag = document.createDocumentFragment(), last = 0, m;
      re.lastIndex = 0;
      while ((m = re.exec(text))) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        var img = document.createElement('img');
        img.className = 'pl';
        img.src = base + M[m[1]];
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        img.loading = 'lazy';
        img.onerror = function () { this.remove(); };
        frag.appendChild(img);
        frag.appendChild(document.createTextNode(m[1]));
        last = m.index + m[1].length;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      t.parentNode.replaceChild(frag, t);
    });
  }

  var css = document.createElement('style');
  css.textContent = 'img.pl{display:inline-block;height:1.05em;width:auto;max-width:2.4em;' +
    'vertical-align:-0.18em;margin:0 .22em 0 .05em;border:0;background:none;box-shadow:none}';
  document.head.appendChild(css);

  function run() { apply(document.body); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
