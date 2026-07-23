# Production deployment

The production host is Debian 13 with Caddy. The feed generator runs as the
non-login `chromium-feed` system account and uses Debian's security-maintained
`/usr/bin/node` package. A separate interactive user's NVM installation is not
part of the service runtime.

## Layout

```text
/opt/chromium-build-sources/                         application (root-owned)
/var/lib/chromium-build-sources/private/             signing material (0700)
/var/lib/chromium-build-sources/cache/               reserved runtime cache
/var/lib/chromium-build-sources/staging/             private generation area
/srv/chromium-build-sources/releases/                immutable feed releases
/srv/chromium-build-sources/chromium                 active release symlink
```

The private key must be installed as:

```text
/var/lib/chromium-build-sources/private/feed-signing-private.pem
```

with owner `chromium-feed:chromium-feed` and mode `0600`.

## Initial preparation

Initialize or reconcile the system account and directories:

```sh
sudo sh ./deploy/setup-host.sh
```

If absent, the setup script creates the `chromium-feed` system user and group
with `/usr/sbin/nologin`. It refuses to alter an inconsistent existing account
and never creates, copies or replaces a signing key.

The first deployment must convert the existing public `chromium` directory
into a release symlink:

```sh
sudo sh ./deploy/migrate-publish-layout.sh
```

The migration preserves the currently served feed as a bootstrap release. Once
the active path is a symlink, every later activation is one atomic rename.

## Manual publication

Run a complete generation, signature verification and atomic activation as the
service account:

```sh
sudo -u chromium-feed \
  /bin/sh /opt/chromium-build-sources/deploy/publish-feed.sh
```

Generation takes place under the private staging directory. The publisher
seeds it with the currently verified feed, runs the real generator, verifies
the resulting JSON and detached signature, copies both files into one immutable
release directory, and only then atomically switches the active symlink.
Failures before activation leave the public feed unchanged.

## systemd

After a successful manual publication, install the units:

```sh
sudo install -o root -g root -m 0644 \
  /opt/chromium-build-sources/deploy/chromium-build-sources.service \
  /etc/systemd/system/chromium-build-sources.service

sudo install -o root -g root -m 0644 \
  /opt/chromium-build-sources/deploy/chromium-build-sources.timer \
  /etc/systemd/system/chromium-build-sources.timer

sudo systemctl daemon-reload
sudo systemctl enable --now chromium-build-sources.timer
```

The timer runs hourly with up to five minutes of randomized delay. A persistent
timer runs a missed update after the host starts again.

Useful checks:

```sh
systemctl list-timers chromium-build-sources.timer
sudo systemctl start chromium-build-sources.service
sudo systemctl status chromium-build-sources.service
sudo journalctl -u chromium-build-sources.service
```

Do not enable the timer until the manual production run, public HTTPS response
and detached signature have all been verified.

## Local health monitoring

The health service verifies the active feed, detached signature and full schema
without network or private-key access. It fails when `generatedAt` is more than
three hours old, allowing a temporary missed hourly generation while detecting
a persistent outage.

Install and test the monitor:

```sh
sudo install -o root -g root -m 0644 \
  /opt/chromium-build-sources/deploy/chromium-build-sources-health.service \
  /etc/systemd/system/chromium-build-sources-health.service

sudo install -o root -g root -m 0644 \
  /opt/chromium-build-sources/deploy/chromium-build-sources-health.timer \
  /etc/systemd/system/chromium-build-sources-health.timer

sudo systemctl daemon-reload
sudo systemctl start chromium-build-sources-health.service
sudo systemctl status chromium-build-sources-health.service
sudo journalctl -u chromium-build-sources-health.service
```

After a successful manual check:

```sh
sudo systemctl enable --now chromium-build-sources-health.timer
systemctl list-timers chromium-build-sources-health.timer
```

The monitor runs every 15 minutes with up to one minute of randomized delay.
Failures are recorded in the journal and visible through `systemctl --failed`.
External notification delivery remains a separate deployment decision because
it requires an approved e-mail, webhook or monitoring destination.
