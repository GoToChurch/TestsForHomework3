import * as request from 'supertest'
import {Test} from '@nestjs/testing';
import {forwardRef, INestApplication} from "@nestjs/common";
import {AuthModule} from "../../src/auth/auth.module";
import {User} from "../../src/users/users.model";
import {ValidationPipe} from "../../src/pipes/validation.pipe";
import {SequelizeModule} from "@nestjs/sequelize";
import {Role} from "../../src/roles/roles.model";
import {UserRoles} from "../../src/roles/user_roles.model";
import {Profile} from "../../src/profiles/profiles.model";
import {TextBlock} from "../../src/textblocks/textblock.model";
import {FileModel} from "../../src/files/files.model";

import jwt_decode from "jwt-decode";

describe('User', () => {
    let app: INestApplication;
    let userToken;
    let adminToken;
    let mockAdmin;
    let mockUser;
    let createdUser;
    let createdAdmin;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                forwardRef(() => AuthModule),
                SequelizeModule.forRoot({
                    dialect: 'postgres',
                    host: 'localhost',
                    port: 5432,
                    username: 'postgres',
                    password: 'Olegbezrukov228',
                    database: 'homework',
                    models: [User, Role, UserRoles, Profile, TextBlock, FileModel],
                    autoLoadModels: true,
                    synchronize: false
                }),],
        }).compile()

        app = moduleRef.createNestApplication();
        app.useGlobalPipes(new ValidationPipe())
        await app.init();

        // Заглушка для объекта создания пользователя
        mockUser = {
            login: "mock32",
            email: "mock32@mock.com",
            password: "mockmock22",
            name: "MockyTheMock",
            surname: "McAlister",
            phoneNumber: "+79189154435",
            address: "someaddress",
        }

        // Создание тествого пользователя
        const user = await request(app.getHttpServer())
            .post('/auth/registration')
            .field('login', mockUser.login)
            .field('email', mockUser.email)
            .field('password', mockUser.password)
            .field('name', mockUser.name)
            .field('surname', mockUser.surname)
            .field('phoneNumber', mockUser.phoneNumber)
            .field('address', mockUser.address)
            .attach('image', `${__dirname}/2.jpg`)
            .expect(201);

        userToken = user.body.token;
        createdUser = jwt_decode<User>(userToken);

        // Заглушка для объекта создания пользователя-администратора
        mockAdmin = {
            login: "Administrator",
            email: "Administrator@mock.com",
            password: "Administrator2",
            name: "Administ",
            surname: "XXCxxxc",
            phoneNumber: "+79186066775",
            address: "adsas asda a11",
        }

        // Создание тествого пользователя-администратора
        let admin = await request(app.getHttpServer())
            .post('/auth/registration')
            .field('login', mockAdmin.login)
            .field('email', mockAdmin.email)
            .field('password', mockAdmin.password)
            .field('name', mockAdmin.name)
            .field('surname', mockAdmin.surname)
            .field('phoneNumber', mockAdmin.phoneNumber)
            .field('address', mockAdmin.address)
            .attach('image', `${__dirname}/2.jpg`)
            .expect(201);

        adminToken = admin.body.token;
        createdAdmin = jwt_decode<User>(adminToken);

        // Добавление роли администратора тестовому пользователю-администратору
        await request(app.getHttpServer())
            .post('/users/role')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                value: 'ADMIN',
                userId: createdAdmin.id
            })
            .expect(201)

        // Необходимо залогиниться заново, чтобы обновить токен
        admin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({
                login: "Administrator",
                email: "Administrator@mock.com",
                password: "Administrator2",
            })
            .expect(201);

        adminToken = admin.body.token;
        createdAdmin = jwt_decode<User>(adminToken);
    })

    it('Get user by id using admin role', async () => {
        await request(app.getHttpServer())
            .get(`/users/${createdUser.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
    })

    it('Get all users using user role', async () => {
        await request(app.getHttpServer())
            .get(`/users`)
            .set('Authorization', `Bearer ${userToken}`)
            .expect(403);
    })

    it('Get all users without authorization', async () => {
        await request(app.getHttpServer())
            .get(`/users`)
            .expect(401);
    })

    it('Edit user by user who is not owner', async () => {
        mockAdmin.name = "Adddddddadam";

        await request(app.getHttpServer())
            .put(`/users/${createdAdmin.id}`)
            .set('Authorization', `Bearer ${userToken}`)
            .send(mockAdmin)
            .expect(403);
    })

    afterAll(async () => {
        await request(app.getHttpServer())
            .delete(`/users/${createdUser.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200)

        await request(app.getHttpServer())
            .delete(`/users/${createdAdmin.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200)

        await app.close();
    });
})