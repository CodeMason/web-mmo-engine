package camp.mage.server.game.objs;

import camp.mage.server.game.World;

/**
 * Created by jacob on 1/13/18.
 */

public class DropObject extends BaseObject {

    private String itemType;

    public DropObject(World world) {
        super(world);
    }

    @Override
    public String getType() {
        return "drop";
    }

    @Override
    public String freeze() {
        return itemType;
    }

    @Override
    public void thaw(String data) {
        this.itemType = data;
    }

    @Override
    public void update() {
        super.update();

        for (Player player : map.getObjs().all(pos, Player.class, 0.5f)) {
            if (player.getState().contains(Player.PlayerState.INTERACTING)) {
                world.leave(this);
            }
            break;
        }
    }
}