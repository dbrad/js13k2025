import { math } from "./math";

export let player: Player;

export let resetPlayer = () => {
    player = {
        stats_: {
            hp_: 10,
            maxHP_: 10,
            speed_: 140,
            damage_: 0,
            defense_: 0,
            fireRate_: 1,
            projectileSpeed_: 200,
            aoeSize_: 64,
        },
        luck_: 0,
        abilities_: [],
        xp_: 0,
        level_: 1,
    };
};

export let UPGRADE_POOL: Upgrade[] = [
    {
        id_: "hp_up",
        name_: "Vitality",
        description_: "+5 Max HP",
        kind_: "stat",
        weight_: 3, // common
        apply_: () => { player.stats_.maxHP_ += 5; },
    },
    {
        id_: "speed_up",
        name_: "Agility",
        description_: "+10 Movement Speed",
        kind_: "stat",
        weight_: 2, // medium
        apply_: (player) => { player.stats_.speed_ += 10; },
    },
    {
        id_: "fireball",
        name_: "Fireball",
        description_: "Launch fireballs automatically",
        kind_: "ability",
        weight_: 1, // rare
        maxLevel_: 5,
        apply_: (player) => {
            let existing = player.abilities_.find(a => a.id_ === "fireball");
            if (existing) {
                existing.level_++;
            } else {
                player.abilities_.push({ id_: "fireball", type_: "bullet", level_: 1, cooldown_: 500 });
            }
        },
    },
    {
        id_: "aura_lightning",
        name_: "Lightning Aura",
        description_: "Damages enemies around you",
        kind_: "ability",
        weight_: 1, // rare
        maxLevel_: 3,
        apply_: (player) => {
            let existing = player.abilities_.find(a => a.id_ === "aura_lightning");
            if (existing) {
                existing.level_++;
            } else {
                player.abilities_.push({ id_: "aura_lightning", type_: "aura", level_: 1, cooldown_: 500 });
            }
        },
    },
];

export let getWeightedRandomUpgrades = (n: number, player: Player): Upgrade[] => {
    let available = UPGRADE_POOL.filter(upg => {
        if (upg.maxLevel_) {
            let ability = player.abilities_.find(a => a.id_ === upg.id_);
            return !ability || ability.level_ < upg.maxLevel_;
        }
        return true;
    });
    let choices: Upgrade[] = [];
    for (let i = 0; i < n && available.length > 0; i++) {
        let totalWeight = available.reduce((sum, upg) => sum + upg.weight_, 0);
        let r = math.random() * totalWeight;
        let chosen: Upgrade | null = null;
        for (let upg of available) {
            if (r < upg.weight_) {
                chosen = upg;
                break;
            }
            r -= upg.weight_;
        }
        if (chosen) {
            choices.push(chosen);
            available = available.filter(upg => upg.id_ !== chosen!.id_);
        }
    }
    return choices;
};

export let updatePlayer = (delta: number) => {
    for (let ability of player.abilities_) {
        ability.cooldown_ -= delta;
    }
};
