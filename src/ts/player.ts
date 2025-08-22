import { findNearestEnemy, nearestEnemyPos, playerDir, playerId, posX, posY, spawnProjectile } from "./entity";
import { gameState } from "./gameState";
import { math, roundTo, sqrt } from "./math";

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
    }, {
        id_: UP_ATK,
        name_: "Ferocity",
        description_: "+1 All Damage",
        kind_: STAT,
        weight_: 3,
        apply_: () => { player.damage_ += 1; },
    }, {
        id_: UP_DEF,
        name_: "Fortify",
        description_: "+1 Defense",
        kind_: STAT,
        weight_: 3,
        apply_: () => { player.defense_ += 1; },
    }, {
        id_: UP_CD,
        name_: "Frequency",
        description_: "-5% Cooldowns",
        kind_: STAT,
        weight_: 2,
        apply_: () => { player.cooldown_ += 5; },
    }, {
        id_: UP_MS,
        name_: "Agility",
        description_: "+10 Movement Speed",
        kind_: STAT,
        weight_: 2,
        apply_: () => { player.speed_ += 10; },
    }, {
        id_: UP_FOOL,
        name_: "0. The Fool",
        description_: "Fires shots in random directions",
        kind_: ABILITY,
        weight_: 1,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_FOOL, BULLET, 500, (a: Ability) => { });
        },
    }, {
        id_: UP_MAGI,
        name_: "1. The Magician",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_PRST,
        name_: "2. The High Priestess",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_EMPS,
        name_: "3. The Empress",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_EMPR,
        name_: "4. The Emperor",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_HIERO,
        name_: "5. The Hierophant",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_LOVER,
        name_: "6. The Lovers",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_CHARI,
        name_: "7. The Chariot",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_STR,
        name_: "8. Strength",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_HERM,
        name_: "9. The Hermit",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_WHEEL,
        name_: "10. Wheel of Fortune",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_JUST,
        name_: "11. Justice",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_HANG,
        name_: "12. The Hanged Man",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_DEATH,
        name_: "13. Death",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_TEMPER,
        name_: "14. Temperance",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_DEVIL,
        name_: "15. The Devil",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_TOWER,
        name_: "16. The Tower",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_STAR,
        name_: "17. The Star",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_MOON,
        name_: "18. The Moon",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_SUN,
        name_: "19. The Sun",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_JUDGE,
        name_: "20. Judgement",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_WORLD,
        name_: "21. The World",
        description_: "Fires 1 powerful piercing shot at a random enemy",
        kind_: ABILITY,
        weight_: 5,
        maxLevel_: 5,
        apply_: () => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability) => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[playerId];
                    let dy = nearestEnemyPos[1] - posY[playerId];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[playerId], posY[playerId], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[playerId], posY[playerId], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    },
];

let upgradeAbility = (id_: number, type_: number, cooldown_: number, fire_: (ability: Ability) => void): void => {
    let existing = player.abilities_.find(a => a.id_ === id_);
    if (existing) {
        existing.level_++;
    } else {
        player.abilities_.push({ id_, type_, level_: 1, cooldown_, timer_: 0, fire_ });
    }
};

export let getWeightedRandomUpgrades = (n: number): Upgrade[] => {
    let available = UPGRADE_POOL.filter(upg => {
        if (upg.maxLevel_) {
            if (player.abilities_.length === 5) {
                return false;
            }
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
        if (ability.timer_ <= 0) {
            ability.fire_(ability);
            ability.timer_ += ability.cooldown_;
        }
        ability.timer_ -= delta;
    }
};
