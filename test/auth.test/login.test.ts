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

describe('Login', () => {
    let app: INestApplication;
    let token;
    let mockLogin;
    let mockUser;

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

        // Заглушка для объекта входа пользователя
        mockLogin = {
            login: "mock32",
            email: "mock32@mock.com",
            password: "mockmock22",
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

        token = user.body.token
    })

    beforeEach(() => {

    })

    it('Login using correct data', async () => {
        await request(app.getHttpServer())
            .post('/auth/login')
            .send(mockLogin)
            .expect(201);
    })

    it('Login using incorrect email', async () => {
        let oldEmail = mockLogin.email;
        mockLogin.email = "sss@sall.ru";

        await request(app.getHttpServer())
            .post('/auth/login')
            .send(mockLogin)
            .expect(401);

        mockLogin.email = oldEmail;
    })

    it('Login using incorrect login', async () => {
        let oldLogin = mockLogin.login;
        mockLogin.login = "asdasd";

        await request(app.getHttpServer())
            .post('/auth/login')
            .send(mockLogin)
            .expect(401);

        mockLogin.login = oldLogin;
    })

    it('Login using incorrect password', async () => {
        let oldPassword = mockLogin.password;
        mockLogin.password = "sada211212s";

        await request(app.getHttpServer())
            .post('/auth/login')
            .send(mockLogin)
            .expect(401);

        mockLogin.password = oldPassword;
    })


    afterAll(async () => {
        const createdUser = jwt_decode<User>(token);

        await request(app.getHttpServer())
            .delete(`/users/${createdUser.id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)

        await app.close();
    });

})