import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';

import { Game } from '../game';
import { MapTile } from '../obj/maptile';
import { ButterflyObject } from '../obj/butterfly';
import { BaseObject } from '../obj/baseobject';
import { PlayerObject } from '../obj/player';
import { FlowerSpawnAreaObject } from '../obj/flowerSpawnArea';
import Config from '../config';
import { MapEvent, ObjDef, EditClientEvent } from '../events/events';

/**
 * Game Editor
 * 
 * Handles all level building activities.
 */
export class Editor {
    
    private dialog: GUI.Rectangle;
    private toolbar: GUI.Rectangle;
    private selectTileIcon: GUI.Image;
    private selectObjectIcon: GUI.Image;
    private selectMoveObjectIcon: GUI.Image;
    private tilesImage: GUI.Image;
    private dialogVisible = false;
    private enabled = false;
    private imageXTileCount = 8;
    private currentTileIndex = 0;
    private currentTileSet = Config.tileSets[0];
    private editorPenMode = 'tile';
    private currentObjMove: BaseObject;
    private currentObjClass: any;

    public onEditorEnabledObservable: BABYLON.Observable<boolean> = new BABYLON.Observable<boolean>();

    constructor(private game: Game) {
        this.toolbar = new GUI.Rectangle();
        this.toolbar.width = '500px';
        this.toolbar.height = '64px';
        this.toolbar.cornerRadius = 5;
        this.toolbar.thickness = 2;
        this.toolbar.background = new BABYLON.Color4(0, 0, 0, .5).toHexString();
        this.toolbar.color = new BABYLON.Color4(1, .5, .25, .5).toHexString();
        this.toolbar.shadowColor = 'black';
        this.toolbar.shadowBlur = 20;

        this.selectTileIcon = new GUI.Image('editorSelectTileIcon', '/assets/grassy_tiles.png');
        this.selectTileIcon.width = '64px';
        this.selectTileIcon.height = '64px';
        this.selectTileIcon.onPointerDownObservable.add(() => {
            this.showDialog();
            this.setDialogContent('tile');            
            this.game.preventInteraction();
        });

        this.selectObjectIcon = new GUI.Image('editorSelectObjectIcon', '/assets/slime.png');
        this.selectObjectIcon.width = '64px';
        this.selectObjectIcon.height = '64px';
        this.selectObjectIcon.left = '64px';
        this.selectObjectIcon.onPointerDownObservable.add(() => {
            this.showDialog();
            this.setDialogContent('obj');
            this.game.preventInteraction();
        });

        this.selectMoveObjectIcon = new GUI.Image('editorSelectMoveObjectIcon', '/assets/move_obj.png');
        this.selectMoveObjectIcon.width = '64px';
        this.selectMoveObjectIcon.height = '64px';
        this.selectMoveObjectIcon.left = '128px';
        this.selectMoveObjectIcon.onPointerDownObservable.add(() => {
            this.editorPenMode = 'move';
            this.game.preventInteraction();
        });

        this.toolbar.addControl(this.selectTileIcon);
        this.toolbar.addControl(this.selectObjectIcon);
        this.toolbar.addControl(this.selectMoveObjectIcon);
    }

    /**
     * Enable the game editor.
     */
    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
        this.onEditorEnabledObservable.notifyObservers(this.enabled);

        if (enabled) {
            this.game.ui.addControl(this.toolbar);
        } else {
            this.game.ui.removeControl(this.toolbar);

            if (this.dialogVisible) {
                this.game.ui.removeControl(this.dialog);
            }
        }
    }

    /**
     * Determine if the editor is currently enabled.
     */
    public isEnabled() {
        return this.enabled;
    }

    /**
     * Run the editor updates. Call once per frame.
     */
    public update() {
        if (this.game.keyPressed('KeyE')) {
            this.setEnabled(!this.enabled);
        }

        if (!this.enabled) {
            return;
        }

        this.toolbar.top = (this.game.ui.getSize().height / 2) - (this.selectTileIcon.heightInPixels / 2);
        this.toolbar.left = 0;
    }

    /**
     * Handles mouse down events.
     */
    public draw(x: number, y: number): boolean {
        if (!this.enabled) {
            return false;
        }

        switch (this.editorPenMode) {
            case 'tile':
                let tile = this.game.world.getMap().getTileAt(this.game.world.getMap().tileXY(x, y));

                if (tile && tile.image === this.currentTileSet && tile.index === this.currentTileIndex) {
                    break;
                }

                this.game.world.getMap().draw(x, y, this.currentTileSet, this.currentTileIndex);

                let editEvent = new EditClientEvent();
                let xy = this.game.world.getMap().tileXY(x, y);
                editEvent.tile = [xy.x, xy.y, Config.tileSets.indexOf(this.currentTileSet), this.currentTileIndex];
                this.game.send(editEvent);

                break;
            case 'obj':
                let pos = this.game.world.getMap().getXY(x, y);

                let evt = new EditClientEvent();
                let objDef = new ObjDef();
                objDef.pos = [pos.x, pos.y];
                objDef.type = Config.objTypesInverse.get(this.currentObjClass);
                evt.addObj = objDef;
                this.game.send(evt);
                
                break;
            case 'move':
                let movePos = this.game.world.getMap().getXY(x, y);

                this.currentObjMove = this.game.world.getMap().getFirstObjAtPos(movePos);

                if (this.currentObjMove){
                    this.currentObjMove.pos.x = movePos.x;
                    this.currentObjMove.pos.z = movePos.y;

                    let evt = new EditClientEvent();
                    let objDef = new ObjDef();
                    objDef.id = this.currentObjMove.id;
                    objDef.pos = [movePos.x, movePos.y];
                    evt.moveObj = objDef;
                    this.game.send(evt);
                }
                
                break;
        }

        return true;
    }

    /**
     * Set the tile to use from an external source.
     */
    public use(tile: MapTile) {
        if (!this.enabled) {
            return;
        }

        if (tile.index < 0) {
            return;
        }

        this.editorPenMode = 'tile';
        this.currentTileSet = tile.image;
        this.currentTileIndex = tile.index;
    }

    /**
     * Shows the editor dialog. Also call setDialogContent() after this.
     */
    private showDialog(show: boolean = true) {
        if (show && !this.dialog) {
            this.dialog = new GUI.Rectangle();
            this.dialog.width = '500px';
            this.dialog.height = '550px';
            this.dialog.background = '#aaa';
            this.dialog.shadowColor = 'black';
            this.dialog.shadowBlur = 20;
            this.dialog.thickness = 2;
            this.dialog.cornerRadius = 5;
            this.dialog.background = new BABYLON.Color4(1, .75, .5, 1).toHexString();
            this.dialog.color = new BABYLON.Color4(1, .5, .25, .75).toHexString();
        }

        if (show && !this.dialogVisible) {
            this.dialogVisible = true;
            this.game.ui.addControl(this.dialog);
        } else {
            this.dialogVisible = false;
            this.game.ui.removeControl(this.dialog);
        }
    }

    /**
     * Set the contents of the editor dialog.
     * 
     * Possible values:
     *      'tile'
     *      'obj'
     */
    private setDialogContent(content: string) {
        this.dialog.children.length = 0;

        switch (content) {
            case 'tile':
                this.setTileSet(this.currentTileSet);
                
                let tileSetSwitcher = GUI.Button.CreateSimpleButton('tileSetSwitcher', 'Next Tile Set');
                tileSetSwitcher.top = '250px';
                tileSetSwitcher.background = '#f0f0f0';
                tileSetSwitcher.cornerRadius = 5;
                tileSetSwitcher.height = '30px';
                tileSetSwitcher.width = '200px';
                tileSetSwitcher.color = new BABYLON.Color4(1, .5, .25, .75).toHexString();
                tileSetSwitcher.background = '#fff';
                tileSetSwitcher.thickness = 2;
                tileSetSwitcher.fontFamily = 'sans';
                tileSetSwitcher.onPointerDownObservable.add(() => {
                    this.setTileSetIndex(Config.tileSets.indexOf(this.currentTileSet) + 1);
                    this.game.preventInteraction();
                });
        
                this.dialog.addControl(tileSetSwitcher);

                break;
            case 'obj':

                let imgAndTypes: any[] = [
                    ['/assets/butterfly_idle.png', ButterflyObject],
                    ['/assets/slime.png', PlayerObject],
                    ['/assets/flower_spawn_area.png', FlowerSpawnAreaObject]
                ];

                for (let i = 0; i < imgAndTypes.length; i++) {
                    let obj = new GUI.Image('objIcon', imgAndTypes[i][0]);
                    obj.width = '64px';
                    obj.height = '64px';
                    obj.top = (-250 + 64 * (i + 1)) + 'px';

                    obj.onPointerDownObservable.add(() => {
                        this.editorPenMode = 'obj';
                        this.currentObjClass = imgAndTypes[i][1];
                        this.showDialog(false);
                        this.game.preventInteraction();
                    });

                    this.dialog.addControl(obj);
                }

                break;
        }
    }

    /**
     * Set the tile set by image name.
     */
    private setTileSet(image: string) {
        this.currentTileSet = image;
        
        if (this.tilesImage) {
            this.dialog.removeControl(this.tilesImage);
        }

        this.tilesImage = new GUI.Image('editorSelectTileIcon', this.currentTileSet);
        this.tilesImage.width = '500px';
        this.tilesImage.height = '500px';
        this.tilesImage.top = '-25px';
        this.dialog.addControl(this.tilesImage);
        
        this.tilesImage.onPointerDownObservable.add(evt => {
            this.currentTileIndex = this.getTileIndex(this.tilesImage.getLocalCoordinates(evt));
            this.editorPenMode = 'tile';
            this.showDialog(false);
            this.game.preventInteraction();
        });
    }

    /**
     * Set the tile set by index. See Config.tileSets.
     */
    private setTileSetIndex(index: number) {
        this.setTileSet(Config.tileSets[index % Config.tileSets.length]);
    }

    /**
     * Get the tile at under a map position.
     */
    private getTileIndex(pos: BABYLON.Vector2): number {
        let x = Math.floor(pos.x / this.tilesImage.widthInPixels * this.imageXTileCount);
        let y = Math.floor((this.tilesImage.heightInPixels - pos.y) / this.tilesImage.heightInPixels * this.imageXTileCount);

        return y * this.imageXTileCount + x;
    }
}