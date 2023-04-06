import * as request from 'supertest'
import { Test } from '@nestjs/testing';
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

describe('Registration', () => {
    let app: INestApplication;
    let mockUser;
    let token;

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
    })

    beforeEach(() => {
        token = null; // Очищаем токен перед каждым тестом

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
    })

    it('Create user with correct data', async () => {
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

        token = user.body.token;
    })

    it('Create user with incorrect data', async () => {
        mockUser.email = "sadas";

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
            .expect(400);
    })

    it('Create user without one attribute', async () => {
        const user = await request(app.getHttpServer())
            .post('/auth/registration')
            .field('email', mockUser.email)
            .field('password', mockUser.password)
            .field('name', mockUser.name)
            .field('surname', mockUser.surname)
            .field('phoneNumber', mockUser.phoneNumber)
            .field('address', mockUser.address)
            .attach('image', `${__dirname}/2.jpg`)
            .expect(400);

    })

    it('Create user with occupied email or login', async () => {
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

        // Попытка создать пользователя с уже занятыми логином и паролем
        await request(app.getHttpServer())
            .post('/auth/registration')
            .field('login', mockUser.login)
            .field('email', mockUser.email)
            .field('password', mockUser.password)
            .field('name', mockUser.name)
            .field('surname', mockUser.surname)
            .field('phoneNumber', mockUser.phoneNumber)
            .field('address', mockUser.address)
            .attach('image', `${__dirname}/2.jpg`)
            .expect(400);

        token = user.body.token;

    })

    afterEach(async () => {
        if (token) {
            const createdUser = jwt_decode<User>(token);

            await request(app.getHttpServer())
                .delete(`/users/${createdUser.id}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
        }
    })

    afterAll(async () => {
        await app.close();
    });

})