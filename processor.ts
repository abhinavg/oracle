import * as foursquare from './foursquare';
import * as opentable from './opentable';
import * as restaurant from './restaurant';
import * as user from './user';

export interface AvailabilityInfo {
    rest: restaurant.Restaurant,
    reserve_url: string,
    availability: string[],
};

export class Processor {
    fsStore: foursquare.FoursquareStore;
    otStore: opentable.OpenTableStore;
    restStore: restaurant.RestaurantStore;
    userStore: user.UserStore;

    constructor(
        fsStore: foursquare.FoursquareStore,
        otStore: opentable.OpenTableStore,
        restStore: restaurant.RestaurantStore
    ) {
        this.fsStore = fsStore;
        this.otStore = otStore;
        this.restStore = restStore;
    }

    async ensureFoursquareVenue(venue: foursquare.FoursquareVenue): Promise<restaurant.Restaurant> {
        let rest = await this.restStore.getByFoursquareID(venue.id);
        if (rest != null) {
            console.log('Already present', rest);
            return rest;
        }
        const fsPutPromise = this.fsStore.put(venue);
        let otRest: opentable.OpenTableRestaurant;
        let otID = await foursquare.findOpenTableLink(venue.id);
        if (otID != null) {
            otRest = {
                id: otID,
                name: venue.name,
                reserve_url: `http://www.opentable.com/single.aspx?rid=${otID}`,
            };
        } else {
            otRest = await opentable.getOpentableInfo(venue.name, venue.location.postalCode);
            if (otRest) {
                otID = otRest.id;
            }
        }
        if (otRest) {
            this.otStore.put(otRest);
        }
        return this.restStore.put({
            _id: null,
            name: venue.name,
            fsID: venue.id,
            otID: otID,
        });
    }

    async ensureVenuesForUser(u: user.User): Promise<restaurant.Restaurant[]> {
        console.log("Ensuring venues for", u);
        const venues = await foursquare.getSavedVenues(u.source);
        console.log(`Found ${venues.length} venues from Foursquare.`)

        const restaurantPromises: Promise<restaurant.Restaurant>[] = [];
        for (let venue of venues) {
            restaurantPromises.push(this.ensureFoursquareVenue(venue));
        }
        return Promise.all(restaurantPromises);
    }

    async checkRestaurants(covers: number, datetime: string): Promise<AvailabilityInfo[]> {
        const u = {
            id: '1',
            name: 'Abhinav Garg',
            source: 'https://api.foursquare.com/v2/lists/156428117/todos',
        };
        console.log(covers, datetime);
        const restaurants = await this.ensureVenuesForUser(u);
        console.log(`Looking up venue availabilities...`);
        const availableTimes: AvailabilityInfo[] = [];
        for(let rest of restaurants) {
            const otInfo = await this.otStore.get(rest.otID);
            if (rest.otID == null) {
                continue;
            }
            const availability = await opentable.checkReservationAvailability(
                otInfo.id, covers, datetime);
            if (availability.length > 0) {
                availableTimes.push({
                    rest: rest,
                    reserve_url: otInfo.reserve_url,
                    availability: availability,
                });
            } else {
                console.log('No availability for', rest);
            }
        }
        return availableTimes;
    }
}