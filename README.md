# Novel Love

## Concept

It's sometimes difficult to start a conversation with people through a dating app. This can be because you don't know how to break the ice or if there are any common interests to talk about. This is why Novel Love can help. People fill in their top 3 favorite book genres and the book they are currently reading, then look for people with the same books and genres on their lists, and start a conversation. They have the same interests, which makes it easy to break the ice and get in to a meaningful conversation in a couple of messages.

## Incorporated Features

- **Signing Up**: It is possible for users to sign up. They can fill in their personal information, top 3 genres and current read. Then, they can create an account.
- **Edit Account**: If a user finished a book, has a new favorite genre, or wants to change their profile picture, this can all be done when editing their account. It is also possible to delete your account if preferred.
- **Find Matches**: According to your favorite genres and current read, you can find people that are interested in the same books. You can get matched.
- **See Other Profiles**: After matching with somebody, you can check out their full profile.
- **Liking Others**: We are also allowing users to like other people, this is needed so people can actually match.

## Tech Stack

- **Runtime**: Node.js
- **Server**: Express
- **Database**: MongoDB

## Dependencies and packages

### Dependencies

- [**express**](https://www.npmjs.com/package/express): To make it possible to use the server
- [**hbs**](https://www.npmjs.com/package/hbs): The templating engine we will be working with
- [**array-find**](https://www.npmjs.com/package/array-find): Helps finding array elements
- [**bcrypt**](https://www.npmjs.com/package/bcrypt): Helping to hash passwords and safely store them
- [**body-parser**](https://www.npmjs.com/package/body-parser): It parses incoming request bodies in a middleware before your handlers. This makes them available under the req.body property
- [**connect-flash**](https://www.npmjs.com/package/connect-flash): The flash is a special area of the session used for storing messages. Messages are written to the flash and cleared after being displayed to the user.
- [**dotenv**](https://www.npmjs.com/package/dotenv): Dotenv is a zero-dependency module that loads environment variables from a `.env` file into `process.env`
- [**express-session**](https://www.npmjs.com/package/express-session): Making the use of sessions possible
- [**mongoose**](https://www.npmjs.com/package/mongoose): Working with MongoDB made easier through schema's and models
- [**multer**](https://www.npmjs.com/package/multer): Allowing file uploads
- [**passport**](https://www.npmjs.com/package/passport): Authentication middleware
- [**passport-facebook**](https://www.npmjs.com/package/passport-facebook): Facebook-strategy for passport
- [**passport-local**](https://www.npmjs.com/package/passport-local): Local-strategy for passport

### Dev Dependencies

- [**eslint**](https://www.npmjs.com/package/eslint): To have a continuous codings style throughout our project
- [**nodemon**](https://www.npmjs.com/package/nodemon): To make running the code whilst working on it easier
- [**prettier**](https://www.npmjs.com/package/prettier): To help enforce our coding style better

### Contributors

- [Nino Schelcher](https://github.com/ninoschelcher)
- [Iris van Ollefen](https://github.com/IrisvanOllefen)
- [Nadine van den Bosch](https://github.com/nadinevdbosch)
- [Mynor Lobos](https://github.com/Mynorloops)
