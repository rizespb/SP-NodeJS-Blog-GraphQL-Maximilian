const { buildSchema } = require('graphql')

// Восклицательный знак для того String!, чтобы если вернем не String из запроса hello, то получим ошибку. ! делает возвращаемое значение обязательным
// input - это специальное слово для описания "типа входных параметров" для резолвера
// То есть, резолвер createUser примет параметры типа UserInputData и обязательно вернет объект User
// AuthData - данные, возвращиемые при аутентификации
module.exports = buildSchema(`
	type Post {
		_id: ID!
		title: String!
		content: String!
		imageUrl: String!
		creator: User!
		createdAt: String!
		updatedAt: String!
	}

	type User {
		_id: ID!
		name: String!
		email: String!
		password: String
		status: String!
		posts: [Post!]!
	}

	type AuthData {
		token: String!
		userId: String!
	}

	type PostData {
		posts: [Post]!
		totalPosts: Int!
	}

	input UserInputData {
		email: String!
		name: String!
		password: String!
	}

	input PostInputData {
		title: String!
		content: String!
		imageUrl: String!
	}

	type RootQuery {
		login(email: String!, password: String!): AuthData!
		posts(page: Int): PostData!
		post(id: ID!): Post!
	}

	type RootMutation {
			createUser(userInput: UserInputData): User!
			createPost(postInput: PostInputData): Post!
			updatePost(id: ID!, postInput: PostInputData): Post!
	}

	schema {
		query: RootQuery
		mutation: RootMutation
	}
`)
