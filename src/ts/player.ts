import { gameState } from "./gameState";
import { math, roundTo } from "./math";

export let player: Player;

export let resetPlayer = () => {
    player = {
        hp_: 10,
        maxHP_: 10,
        speed_: 140,
        damage_: 0,
        defense_: 0,
        cooldown_: 0,
        fireRate_: 1,
        luck_: 0,
        abilities_: [],
        xp_: 0,
        level_: 1,
    };
};

export let xpTable: number[] = Array.from({ length: 30 }, (_, i) => roundTo(50 * (1.5 ** (i - 1)), 5));

export let xpUp = (val: number) => {
    player.xp_ += val;
    let nextLevel = xpTable[player.level_];
    if (player.xp_ >= nextLevel) {
        player.xp_ -= nextLevel;
        player.level_ += 1;
        gameState[GS_LEVELUP_PENDING] = 1;
    }
};

export let UPGRADE_POOL: Upgrade[] = [
    {
        id_: UP_HP,
        name_: "Vitality",
        description_: "+5 Max HP",
        kind_: STAT,
        weight_: 3,
        apply_: () => { player.maxHP_ += 5; player.hp_ += 5; },
    },
    {
        id_: UP_ATK,
        name_: "Ferocity",
        description_: "+1 All Damage",
        kind_: STAT,
        weight_: 3,
        apply_: () => { player.damage_ += 1; },
    },
    {
        id_: UP_DEF,
        name_: "Fortify",
        description_: "+1 Defense",
        kind_: STAT,
        weight_: 3,
        apply_: () => { player.defense_ += 1; },
    },
    {
        id_: UP_CD,
        name_: "Frequency",
        description_: "-5% Cooldowns",
        kind_: STAT,
        weight_: 2,
        apply_: () => { player.cooldown_ += 5; },
    },
    {
        id_: UP_MS,
        name_: "Agility",
        description_: "+10 Movement Speed",
        kind_: STAT,
        weight_: 2,
        apply_: () => { player.speed_ += 10; },
    },
    {
        id_: UP_FOOL,
        name_: "0. The Fool",
        description_: "Fires shots in random directions",
        kind_: ABILITY,
        weight_: 1,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility({ id_: UP_FOOL, type_: BULLET, level_: 1, cooldown_: 500 });
        },
    },
];

let upgradeAbility = (ability: Ability): void => {
    let existing = player.abilities_.find(a => a.id_ === ability.id_);
    if (existing) {
        existing.level_++;
    } else {
        player.abilities_.push(ability);
    }
};

export let getWeightedRandomUpgrades = (n: number): Upgrade[] => {
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
