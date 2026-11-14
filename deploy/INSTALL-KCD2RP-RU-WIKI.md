# KCD2RP Wiki v0.4 — запуск на https://kcd2rp.ru/wiki

Эта сборка работает из `/wiki` на существующем домене KCD2RP. Основной сайт Vue не меняется. Для Node.js используется `127.0.0.1:3082`, наружу порт 3082 открывать **не нужно**.

## 1. Загрузите полный архив на сервер

Например, через SFTP положите `KCD2RP-Wiki-v0.4-kcd2rp.ru-wiki.zip` в домашний каталог, затем:

```bash
sudo apt update
sudo apt install -y nodejs unzip openssl
node --version  # требуется Node 18+
sudo unzip -o ~/KCD2RP-Wiki-v0.4-kcd2rp.ru-wiki.zip -d /srv
sudo useradd --system --no-create-home --shell /usr/sbin/nologin kcd2wiki 2>/dev/null || true
sudo install -d -o kcd2wiki -g kcd2wiki -m 0750 /srv/kcd2rp-wiki/data
sudo chown -R kcd2wiki:kcd2wiki /srv/kcd2rp-wiki/data
```

**Внимание:** при обновлении установленной Wiki не удаляйте `data/` и не перезаписывайте `/etc/kcd2rp-wiki.env`. В `data/` лежат редактируемые статьи, метки и загруженные изображения.

## 2. Создайте секреты (только при первом запуске)

```bash
sudo install -m 600 /dev/null /etc/kcd2rp-wiki.env
sudo tee /etc/kcd2rp-wiki.env >/dev/null <<EOF
HOST=127.0.0.1
PORT=3082
WIKI_BASE_PATH=/wiki
NODE_ENV=production
WIKI_ADMIN_USER=admin
WIKI_ADMIN_PASSWORD=$(openssl rand -hex 24)
WIKI_SESSION_SECRET=$(openssl rand -hex 32)
EOF
```

Пароль редактора находится в `/etc/kcd2rp-wiki.env` (смотрите только локально, никому не пересылайте).

## 3. Запустите systemd

```bash
sudo cp /srv/kcd2rp-wiki/deploy/kcd2rp-wiki.service /etc/systemd/system/kcd2rp-wiki.service
sudo systemctl daemon-reload
sudo systemctl enable --now kcd2rp-wiki
sudo systemctl --no-pager --full status kcd2rp-wiki
curl -I http://127.0.0.1:3082/
```

Если служба не запустилась:

```bash
sudo journalctl -u kcd2rp-wiki -n 70 --no-pager
```

## 4. Nginx (существующий HTTPS-сайт)

Отредактируйте **первый server-блок, обслуживающий HTTPS 443** в `/etc/nginx/sites-available/kcd2rp.ru`. Не добавляйте отдельный `server` и не заменяйте существующие `location /`, `/assets/`, `/kcdmp-ui/`, `/pal24/`, `/api/kcd2/status`, include phpMyAdmin.

Перед редактированием сделайте копию:

```bash
sudo cp -a /etc/nginx/sites-available/kcd2rp.ru "/etc/nginx/sites-available/kcd2rp.ru.bak.$(date +%Y%m%d-%H%M%S)"
sudo nano /etc/nginx/sites-available/kcd2rp.ru
```

Добавьте содержимое `deploy/nginx-wiki-location.conf` **внутри** первого HTTPS `server { ... }`, перед `location / { ... }`:

```nginx
location = /wiki { return 301 /wiki/; }
location ^~ /wiki/ {
    client_max_body_size 10m;
    proxy_pass http://127.0.0.1:3082/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 3s;
    proxy_read_timeout 30s;
    proxy_redirect off;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options SAMEORIGIN always;
}
```

Обратите внимание на завершающий `/` в `proxy_pass`: он удаляет префикс `/wiki/` перед передачей запроса в Node. Клиентские JS, ссылки и изображения этой сборки используют префикс `/wiki`.

Примените:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 5. Проверьте работу

```bash
curl -I https://kcd2rp.ru/wiki/
curl -I https://kcd2rp.ru/wiki/style.css
curl -I https://kcd2rp.ru/wiki/app.js
curl -s https://kcd2rp.ru/wiki/api/game/meta | head -c 300
```

Страницы:
- https://kcd2rp.ru/wiki/
- https://kcd2rp.ru/wiki/game/items
- https://kcd2rp.ru/wiki/animations
- https://kcd2rp.ru/wiki/icons
- https://kcd2rp.ru/wiki/admin

## 6. Сеть и firewall

Роутер уже пробрасывает TCP 80/443 на 192.168.0.202. Дополнительный NAT для Wiki не нужен. В UFW должны быть открыты только необходимые входящие HTTP/HTTPS (если не были):

```bash
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

**Не открывайте 3082 в UFW и на роутере.** Wiki слушает только `127.0.0.1:3082`.

## Данные и обновления

Бэкапьте `/srv/kcd2rp-wiki/data/` вместе с резервной копией сервера. При обновлениях используйте штатный `deploy/update-existing-wiki.sh` (после проверки, что у новой версии тоже есть поддержка `/wiki`).
