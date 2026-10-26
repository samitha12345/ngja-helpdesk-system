# NGJA Helpdesk API

Laravel 12 REST API for the NGJA Helpdesk frontend. The local Windows setup uses XAMPP PHP/MySQL and phpMyAdmin; it does not require Laragon.

## Requirements

- PHP 8.2 or later with the extensions required by Laravel
- Composer
- XAMPP MySQL

## Local setup

1. Start MySQL from the XAMPP Control Panel.
2. In phpMyAdmin, create a database named `ngja_helpdesk` using `utf8mb4_unicode_ci`.
3. Copy `.env.example` to `.env` if needed and set the MySQL connection values:

   ```dotenv
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=ngja_helpdesk
   DB_USERNAME=root
   DB_PASSWORD=
   ```

4. Set a unique bootstrap admin password of at least 12 characters in `.env`. The local default email is `admin@ngja.lk`; change it if needed. This password is only used to create/update the bootstrap administrator when seeding.
5. From PowerShell in this directory, install dependencies, prepare the app and database, then start the API:

   ```powershell
   composer install
   C:\xampp\php\php.exe artisan key:generate
   C:\xampp\php\php.exe artisan migrate --seed
   C:\xampp\php\php.exe artisan serve --host=127.0.0.1 --port=8000
   ```

   If the `php` command already points to XAMPP PHP 8.2, `php artisan ...` can be used instead.
6. Keep the Laravel server running while using the frontend. The default API base URL is `http://127.0.0.1:8000/api`. To override it, set `VITE_API_BASE_URL` in the frontend environment.

## API overview

Registration, login, and the department/category lookups are public. Ticket, account, officer, and administration endpoints require a Sanctum bearer token.

- `POST /api/register`, `POST /api/login`, `POST /api/logout`, `GET /api/me`
- `GET|POST /api/tickets`, `GET|PATCH /api/tickets/{ticket}`
- `POST /api/tickets/{ticket}/comments`
- `POST /api/tickets/{ticket}/attachments`
- `GET /api/departments`, `GET /api/categories`, `GET /api/officers`
- Administrator endpoints for users, departments and categories

Ticket listing supports filters, pagination, and a summary. Ticket visibility and confidential department details are restricted by role and permission. Uploaded files are stored on Laravel's private local disk.

## Tests

```powershell
C:\xampp\php\php.exe artisan test
```

The test suite uses the in-memory SQLite connection configured in `phpunit.xml`.
