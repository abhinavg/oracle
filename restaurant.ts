import {Db, ObjectID} from 'mongodb';

import {FoursquareID, FoursquareVenue} from './foursquare';
import {OpenTableID} from './opentable';

export interface Restaurant {
    _id: string;
    name: string;
    fsID: FoursquareID|null;
    otID: OpenTableID|null;
}

export class RestaurantStore {
    db: Db;
    collection = 'restaurants';

    constructor(db: Db) {
        this.db = db;
    }

    async put(rest: Restaurant): Promise<Restaurant> {
        const result = await this.db.collection(this.collection).insertOne(rest);
        rest._id = result.insertedId.toHexString();
        console.log(rest);
        return rest
    }

    async get(id: string): Promise<Restaurant|null> {
        return this.db.collection(this.collection).findOne({
            '_id': new ObjectID(id),
        });        
    }

    async getByFoursquareID(fsID: FoursquareID): Promise<Restaurant|null> {
        return this.db.collection(this.collection).findOne({'fsID': fsID})
    }
}

