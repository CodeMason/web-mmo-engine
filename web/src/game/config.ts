import { PlayerObject } from "./obj/player";
import { ButterflyObject } from "./obj/butterfly";
import { FlowerSpawnAreaObject } from "./obj/flowerSpawnArea";
import { FlowerObject } from "./obj/flower";


/**
 * Game static definitions.
 */
export default class Config {
    public static tileSets = [
        '/assets/grassy_tiles.png',
        '/assets/underground_tiles.png'
    ];

    public static objTypes: Map<string, any> = new Map();
    public static objTypesInverse: Map<any, string> = new Map();

    static init() {
        [
            ['player', PlayerObject],
            ['butterfly', ButterflyObject],
            ['flower', FlowerObject],
            ['flower-spawn-area', FlowerSpawnAreaObject]
        ]
        
        .forEach((t: any[]) => {
            this.objTypes.set(t[0], t[1]);
            this.objTypesInverse.set(t[1], t[0]);
        });
    }
}