import { FastifyInstance } from 'fastify';
import userController from '@controllers/controllerUser';
import controller2FA from '@controllers/controller2FA';
import userSchema from '@schemas/userSchema';
import Middleware from '@Middleware';

export default async (fastify: FastifyInstance) => {
	fastify.post('/login', {
		preHandler: [Middleware.isNotAuthenticated],
		schema: userSchema.login,
		handler: userController.Login
	});

	fastify.post('/register', {
		preHandler: [Middleware.isNotAuthenticated],
		schema: userSchema.register,
		handler: userController.Register
	});

	fastify.post('/forget-password', {
		preHandler: [Middleware.isNotAuthenticated],
		schema: userSchema.forgetPassword,
		handler: userController.ForgetPassword
	});

	fastify.put('/update-user', {
		preHandler: [Middleware.isAuthenticated],
		schema: userSchema.update,
		handler: userController.UpdateUser
	});

	fastify.get('/logout', {
		schema: userSchema.logout,
		handler: userController.Logout
	});

	fastify.get('/isAuth', {
		schema: userSchema.isAuth,
		handler: Middleware.isAuth,
	});

	fastify.post('/auth/google/callback', {
		schema: userSchema.authGoogleCallback,
		handler: userController.authGoogleCallback,
	});

	fastify.post('/auth/checkCode', {
		schema: userSchema.verifyCode,
		handler: controller2FA.verifyCode,
	});

	fastify.get('/user/:userId', {
		preHandler: [Middleware.isAuthenticated],
		schema: userSchema.getUserProfile,
		handler: userController.getUserProfile,
	});
};