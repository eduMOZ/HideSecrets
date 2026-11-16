// Proxy auto-config of an invented agency
// Specific rules for project-aurora users: see the intranet wiki (Project-Aurora, v2)
function FindProxyForURL(url, host) {
  if (isPlainHostName(host) || shExpMatch(host, "10.*.*.*")) { return "DIRECT"; }
  if (dnsDomainIs(host, ".intranet.example-agency.test") ||
      dnsDomainIs(host, "*.corp.example-agency.test") ||
      dnsDomainIs(host, ".wiki.nimbus.intranet") ||
      dnsDomainIs(host, ".github.com") ||
      shExpMatch(host, "*.internal.example.org")) {
    return "PROXY 10.20.30.40:3128";
  }
  return "DIRECT";
}
