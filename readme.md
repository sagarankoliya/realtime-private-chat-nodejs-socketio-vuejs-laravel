## Realtime Private Chat

Here I have showing you that how to create realtime private chat application using socket io, Node JS, VueJS, Laravel.

---

##### System Requirements

The following are required to function properly.

- **Node v8.4.0+**
- **Socket io v2.0**
- **Vue.js v2.4.0**
- **Laravel 5.4+**

##### Chat application features

1. Private chatting
2. File send and receive
3. Online Offline status
4. Typing indicator
5. Messages stored in database(MYSQL)

##### Getting Started

**_Step : 1_**

```
git clone https://github.com/sagarankoliya/realtime-private-chat-nodejs-socketio-vuejs-laravel.git
```

**_Step : 2_**

Go to project directory using **Terminal / CMD**

```
composer install
```

**_Step : 3_**

In project directory find **_.env.example_** and rename to **_.env_**

Generate laravel application key

```
php artisan key:generate
```

Also change **DB_DATABASE, DB_USERNAME, DB_PASSWORD** in .env

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your db name
DB_USERNAME=your db username
DB_PASSWORD=your db password
```

Also add below line in your .env

```
WS_URL=http://localhost:3000/
```

**_Step : 4_**

Run Migration & Seeder

```
php artisan migrate

php artisan db:seed --class=UserTableSeeder
```

**_Step : 5_**

Go to project directory using **Terminal / CMD**

Open **nodejs** folder

install node dependencies

```
npm install
```

**_Step : 6_**

In **nodejs** directory open **config/dev.json** file

change **database, user, password**

below database configuration is same as above.

```
"host": "localhost",
"port": 3306,
"user": "your db username",
"password": "your db password",
"database": "your db name"
```

**_Step : 7_**

**Start Node JS Chat Server**

Go to project directory using **Terminal / CMD** Open **nodejs** folder

```
export NODE_ENV=dev
npm start
```

**Start Laravel Server**

Open Second **Terminal / CMD** Go to project directory

```
php artisan serve
```

Open http://127.0.0.1:8000 url in multipal browser


**Login with below Users**

| No  | Username | Password |
| ------------- | ------------- | ------------- |
| 1  | user1@gmail.com  | 123456 |
| 2  | user2@gmail.com  | 123456 |
| 3  | user3@gmail.com  | 123456 |

**Login at least 2 user in different browser.**

#### After login you can see all users in right sidebar click anyone user and start private chatting.

### Thats it.

Feel free to contact me if you have any query. (^_^)
