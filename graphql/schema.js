const { buildSchema } = require('graphql')

// Восклицательный знак для того String!, чтобы если вернем не String из запроса hello, то получим ошибку. ! делает возвращаемое значение обязательным
// input - это специальное слово для описания "типа входных параметров" для резолвера
// То есть, резолвер createUser примет параметры типа UserInputData и обязательно вернет объект User
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

	input UserInputData {
		email: String!
		name: String!
		password: String!
	}

	type RootQuery {
		hello: String
	}

	type RootMutation {
			createUser(userInput: UserInputData): User!
	}

	schema {
		query: RootQuery
		mutation: RootMutation
	}
`)
