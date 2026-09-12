# Enterprise architecture patterns (pick one to start)

Each pattern below states when to use it, a layout sketch (in 680-wide coordinates), and its node/flow conventions. Combine sparingly; one pattern per diagram keeps it readable. All coordinate math follows `svg-conventions.md`.

Table of contents:
1. Zoned lanes (trust boundaries)
2. Reverse-proxy / gateway convergence
3. Zero-trust / clientless (无端) access
4. SSO / identity federation
5. Deployment / hub-and-spoke
6. Choosing & combining

---

## 1. Zoned lanes (trust boundaries)

**When**: the story is *where things live* and *what crosses the boundary* — public vs DMZ vs internal, or partner vs corp. The default backbone for security/access architecture.

**Layout**: 3–4 vertical (or horizontal) dashed zone rects side by side, ordered by trust. Components nest inside their zone. Cross-zone arrows visibly cross the dashed edges.

```
公网 (untrusted)      DMZ / 网关            内网 (trusted)
┌─────────────┐   ┌──────────────┐    ┌──────────────┐
│  用户/浏览器 │──▶│  接入网关     │──▶ │  业务系统     │
│  外部系统    │   │  认证/登录页  │    │  身份源/目录  │
└─────────────┘   └──────────────┘    └──────────────┘
   coral zone         amber zone           teal zone
```

**Conventions**: zone fill `none`, dashed stroke in the zone's trust color (coral/amber/teal). Components = gray or a single category ramp. Put one representative component per role; don't list every server. Label the boundary crossing with the protocol (HTTPS in, SSO/LDAP internal).

## 2. Reverse-proxy / gateway convergence

**When**: showing that many backend apps are *hidden behind* one gateway and only reachable through it ("应用收敛", "隐藏内网身份系统", WAF/zero-trust proxy).

**Layout**: single gateway node in the middle DMZ; a fan-in of clients on the left, a fan-out of protected apps on the right (kept to ≤4 apps — if more, draw one "业务系统 ×N" node). Emphasize that direct arrows to the apps are blocked.

```
clients ──▶ [ 接入网关 ]══▶ app A
                 ║      ╲─▶ app B
        ✕直连被拦   ╲────▶ app C
```

**Conventions**: gateway = the emphasis node (blue). Protected apps = gray inside the internal zone. Show the "direct access blocked" idea with a red dashed line + a small `ti`-style note in prose (not a hand-drawn icon) or a red "✕ 直连不可达" label near a dashed line that stops at the zone edge. Keep the allowed path solid, the blocked path dashed red.

## 3. Zero-trust / clientless (无端) access

**When**: browser-based (无端) or client (有端) access through an identity-aware proxy where **every request re-authenticates** and a login page must be shown before backend reach. Common for iOA-style / BeyondCorp-style access.

**Layout**: a horizontal or vertical pipeline: user → gateway (policy: authenticated?) → identity broker/login page → upstream IdP (SSO) → account/directory action → backend app. A small decision diamond or a labeled note captures "no session ⇒ show login page (cannot skip)". Annotate client-vs-clientless differences as two short lanes or a legend note, not two full diagrams.

**Conventions**: gateway/broker/account = one ramp (blue = the access product). Upstream IdP = purple (external identity). User/app = gray. Label key mechanics on arrows: "302", "弹窗认证", "登录即创建", "回写账号", "每次访问需触发". If a step is a hard constraint, keep it a full node (don't bury it in prose).

## 4. SSO / identity federation

**When**: the point is the *token/assertion exchange* between a service provider and an identity provider (SAML/OIDC/CAS), and where accounts/attributes land.

**Layout**: SP (left) ↔ broker/gateway (middle) ↔ IdP (right), with a returning arrow for the assertion/redirect. Directory/account store sits below the broker with a "provision / 登录即创建" arrow.

**Conventions**: use paired arrows (request out, assertion back). Label with `SAML 断言` / `OIDC code` / `SSO 回调` / `302`. Directory = teal (internal trusted). Make the trust direction explicit: the broker trusts the IdP's assertion; the SP trusts the broker.

## 5. Deployment / hub-and-spoke

**When**: physical/logical deployment — a central platform with satellite systems, or on-prem/private-cloud vs SaaS split.

**Layout**: hub node centered; spokes around it BUT laid out as a left/right column list (never a literal radial ring — the spec has no collision check for rings). Group spokes by type in labeled zones.

**Conventions**: hub = emphasis ramp; spokes = gray. Use zones to separate 私有化/on-prem from SaaS/公有云. Label links with transport (VPN, 专线, HTTPS).

## 6. Choosing & combining

- Access/security architecture → start with **Zoned lanes (1)** as the backbone, then overlay **reverse-proxy (2)** or **zero-trust (3)** mechanics inside the DMZ zone.
- "How does auth actually flow" → **zero-trust (3)** or **SSO (4)**; if the user wants the time-ordered handshake instead of topology, that's a sequence diagram — note it and offer it separately.
- Keep it to one backbone. If the user needs both topology and sequence, deliver two diagrams with prose between, not one hybrid.
- Always finish with a legend when zones or categories use color, and name the trust level of each zone in its label (e.g. "公网（不可信）", "内网（可信）").
