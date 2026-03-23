#!/usr/bin/env bash
set -euo pipefail

echo "[1/8] Installing required packages..."
sudo pacman -Syu --needed apache mariadb php php-apache phpmyadmin

echo "[2/8] Initializing MariaDB data directory (if needed)..."
if [ ! -d "/var/lib/mysql/mysql" ]; then
  sudo mariadb-install-db --user=mysql --basedir=/usr --datadir=/var/lib/mysql
else
  echo "MariaDB data directory already initialized."
fi

echo "[3/8] Enabling and starting MariaDB..."
sudo systemctl enable --now mariadb

echo "[4/8] Ensuring Apache modules for PHP are enabled..."
HTTPD_CONF="/etc/httpd/conf/httpd.conf"

sudo sed -i \
  -e 's/^#\s*LoadModule mpm_prefork_module modules\/mod_mpm_prefork.so/LoadModule mpm_prefork_module modules\/mod_mpm_prefork.so/' \
  -e 's/^LoadModule mpm_event_module modules\/mod_mpm_event.so/#LoadModule mpm_event_module modules\/mod_mpm_event.so/' \
  -e 's/^#\s*LoadModule php_module modules\/libphp.so/LoadModule php_module modules\/libphp.so/' \
  "$HTTPD_CONF"

if ! sudo grep -q '^Include conf/extra/php_module.conf' "$HTTPD_CONF"; then
  echo 'Include conf/extra/php_module.conf' | sudo tee -a "$HTTPD_CONF" >/dev/null
fi

echo "[5/8] Creating phpMyAdmin Apache include..."
sudo tee /etc/httpd/conf/extra/phpmyadmin.conf >/dev/null <<'EOF'
Alias /phpmyadmin "/usr/share/webapps/phpMyAdmin"
<Directory "/usr/share/webapps/phpMyAdmin">
    DirectoryIndex index.php
    AllowOverride All
    Options FollowSymlinks
    Require all granted
</Directory>
EOF

if ! sudo grep -q '^Include conf/extra/phpmyadmin.conf' "$HTTPD_CONF"; then
  echo 'Include conf/extra/phpmyadmin.conf' | sudo tee -a "$HTTPD_CONF" >/dev/null
fi

echo "[6/8] Testing Apache config..."
sudo apachectl configtest

echo "[7/8] Enabling and starting Apache..."
sudo systemctl enable --now httpd

echo "[8/8] Final service status + URL"
systemctl --no-pager --full status mariadb | head -n 8 || true
systemctl --no-pager --full status httpd | head -n 8 || true

echo ""
echo "Done. Open: http://localhost/phpmyadmin"
echo "Next recommended manual step: sudo mysql_secure_installation"
