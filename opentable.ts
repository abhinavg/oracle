import * as cheerio from 'cheerio';
import * as lodash from 'lodash';
import {Db, ObjectID} from 'mongodb';

import * as http from './http';

export type OpenTableID = number;

export interface OpenTableRestaurant {
	id: OpenTableID;
	name: string;
	reserve_url: string;
}

export class OpenTableStore {
    db: Db;
    collection = 'ot_restaurants';

	constructor(db: Db) {
		this.db = db;
	}

    async put(rest: OpenTableRestaurant): Promise<OpenTableRestaurant> {
        const result = await this.db.collection(this.collection).insertOne(rest);
		return rest;
    }

    async get(id: OpenTableID): Promise<OpenTableRestaurant|null> {
        return this.db.collection(this.collection).findOne({'id': id});
    }
}

export async function getOpentableInfo(name: string, zip: string|number):Promise<OpenTableRestaurant|null> {
    const options = {
        uri: 'https://opentable.herokuapp.com/api/restaurants',
        qs: {
            name: name,
            zip: zip,
        },
        json: true,
    }
	const body = await http.requestWrapper(options);
	if (body.total_entries < 1) {
		return null;
	}
	return body.restaurants[0];
}

function parseOpenTableSlots(availability: string):string[] {
	const $ = cheerio.load(availability);
	const timesNodes = $('.dtp-results-times').find('a[data-datetime]').toArray();
	return lodash.map(timesNodes, (node) => node.attribs['data-datetime']);
}

export async function checkReservationAvailability(
	id: OpenTableID, covers: number, datetime: string):Promise<string[]> {
	const options = {
		uri: `https://www.opentable.com/restaurant/profile/${id}/search`,
		method: 'POST',
		json: true,
		body: {
			covers: covers,
			dateTime: datetime,
		},
	};
	const body = await http.requestWrapper(options);
	return parseOpenTableSlots(body.availability);
}