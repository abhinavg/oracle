import {Db, ObjectID} from 'mongodb';

export interface User {
    id: string;
    name: string;
    source: string;
}

export class UserStore {
    db: Db;
    collection = 'users';

    constructor(db: Db) {
        this.db = db;
    }

    async put(user: User): Promise<User> {
        const result = await this.db.collection(this.collection).insert(user);
        user.id = result.insertedId.toHexString();
        return user;
    }

    async get(id: string): Promise<User|null> {
        return this.db.collection(this.collection).findOne(
            {'_id': new ObjectID(id)}
        );
    }

}