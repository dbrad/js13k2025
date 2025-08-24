import { findNearestEnemy, nearestEnemyPos, playerDir, posX, posY, spawnAura, spawnProjectile } from "./entity";
import { gameState } from "./gameState";
import { cos, max, min, PI, randInt, random, roundTo, sin, sqrt } from "./math";

export let player: Player;

export let resetPlayer = (): void => {
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
    UPGRADE_POOL[UP_CLAW].apply_();
};

export let xpTable: number[] = Array.from({ length: 30 }, (_, i) => roundTo(25 * (1.5 ** (i - 1)), 5));

export let gainXp = (val: number): void => {
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
        apply_: (): void => { player.maxHP_ += 5; player.hp_ += 5; },
    }, {
        id_: UP_ATK,
        name_: "Ferocity",
        description_: "+1 All Damage",
        kind_: STAT,
        apply_: (): void => { player.damage_ += 1; },
    }, {
        id_: UP_DEF,
        name_: "Fortify",
        description_: "+1 Defense",
        kind_: STAT,
        apply_: (): void => { player.defense_ += 1; },
    }, {
        id_: UP_CD,
        name_: "Frequency",
        description_: "-5% Cooldowns",
        kind_: STAT,
        apply_: (): void => { player.cooldown_ += 5; },
    }, {
        id_: UP_MS,
        name_: "Agility",
        description_: "+10 Movement Speed",
        kind_: STAT,
        apply_: (): void => { player.speed_ += 10; },
    }, {
        id_: UP_CLAW,
        name_: "Cat Claw",
        description_: "Feriously claw at nearby enemies|upgrade: range+ pierce+",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_CLAW, BULLET, 500, (a: Ability): void => {
                let speed = 500;
                let range = 0.1 + (a.level_ - 1) * 0.1;
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[0];
                    let dy = nearestEnemyPos[1] - posY[0];
                    let dist = sqrt(dx * dx + dy * dy);
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    let perpX = -dy / dist * 10;
                    let perpY = dx / dist * 10;
                    spawnProjectile(posX[0], posY[0], vx, vy, 2, 1, range, a.level_);
                    spawnProjectile(posX[0] + perpX, posY[0] + perpY, vx, vy, 2, 1, range, a.level_);
                    spawnProjectile(posX[0] - perpX, posY[0] - perpY, vx, vy, 2, 1, range, a.level_);
                } else {
                    let vx = playerDir === 0 ? -speed : speed;
                    spawnProjectile(posX[0], posY[0], vx, 0, 2, 1, range, a.level_);
                    spawnProjectile(posX[0], posY[0] + 10, vx, 0, 2, 1, range, a.level_);
                    spawnProjectile(posX[0], posY[0] - 10, vx, 0, 2, 1, range, a.level_);
                }
            });
        },
    }, {
        id_: UP_FOOL,
        name_: "The Fool",
        description_: "Fire in random directions|upgrade: projectiles+",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_FOOL, BULLET, 300, (a: Ability): void => {
                for (let i = 0; i < a.level_ + 1; i++) {
                    let a = random() * PI * 2;
                    let speed = randInt(150, 200);
                    let vx = cos(a) * speed;
                    let vy = sin(a) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 3, 5, 2);
                }
            });
        },
    }, {
        id_: UP_MAGI,
        name_: "The Magician",
        description_: "Fire a powerful piercing shot|at a nearby enemies|upgrade: damage+ size+",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_MAGI, BULLET, 2000, (a: Ability): void => {
                let speed = 300;
                let dmg = 10 * a.level_;
                let size = 5 * a.level_;
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[0];
                    let dy = nearestEnemyPos[1] - posY[0];
                    let dist = sqrt(dx * dx + dy * dy);
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, size, dmg, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -speed : speed;
                    spawnProjectile(posX[0], posY[0], vx, 0, size, dmg, 5, 999);
                }
            });
        },
    }, {
        id_: UP_PRST,
        name_: "The High Priestess",
        description_: "Slow nearby enemies",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_PRST, AURA, 5000, (a: Ability): void => {
                let slow = max(0.7 - (a.level_ - 1) * 0.1, 0.3);
                let radius = 50 + a.level_ * 10;
                a.entityId_ = spawnAura(radius, 0, -1, 0x22ff8888, slow, a.entityId_);
            });
        },
    }, {
        id_: UP_EMPS,
        name_: "The Empress",
        description_: "Slowly regenerate heal",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_EMPS, AURA, 1000, (a: Ability): void => {
                player.hp_ = min(player.maxHP_, player.hp_ + (0.1 * a.level_));
            });
        },
    }, {
        id_: UP_EMPR,
        name_: "The Emperor",
        description_: "",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_EMPR, BULLET, 1000, (a: Ability): void => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[0];
                    let dy = nearestEnemyPos[1] - posY[0];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[0], posY[0], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_HIERO,
        name_: "The Hierophant",
        description_: "",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability): void => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[0];
                    let dy = nearestEnemyPos[1] - posY[0];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[0], posY[0], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_LOVER,
        name_: "The Lovers",
        description_: "",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_LOVER, AURA, 1000, (a: Ability): void => {
            });
        },
    }, {
        id_: UP_CHARI,
        name_: "The Chariot",
        description_: "",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability): void => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[0];
                    let dy = nearestEnemyPos[1] - posY[0];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[0], posY[0], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_STR,
        name_: "Strength",
        description_: "",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability): void => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[0];
                    let dy = nearestEnemyPos[1] - posY[0];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[0], posY[0], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_HERM,
        name_: "The Hermit",
        description_: "",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability): void => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[0];
                    let dy = nearestEnemyPos[1] - posY[0];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[0], posY[0], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_WHEEL,
        name_: "Wheel of Fortune",
        description_: "",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability): void => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[0];
                    let dy = nearestEnemyPos[1] - posY[0];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[0], posY[0], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_JUST,
        name_: "Justice",
        description_: "",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability): void => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[0];
                    let dy = nearestEnemyPos[1] - posY[0];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[0], posY[0], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_HANG,
        name_: "The Hanged Man",
        description_: "",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability): void => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[0];
                    let dy = nearestEnemyPos[1] - posY[0];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[0], posY[0], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_DEATH,
        name_: "Death",
        description_: "",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability): void => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[0];
                    let dy = nearestEnemyPos[1] - posY[0];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[0], posY[0], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_TEMPER,
        name_: "Temperance",
        description_: "",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability): void => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[0];
                    let dy = nearestEnemyPos[1] - posY[0];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[0], posY[0], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_DEVIL,
        name_: "The Devil",
        description_: "",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability): void => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[0];
                    let dy = nearestEnemyPos[1] - posY[0];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[0], posY[0], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_TOWER,
        name_: "The Tower",
        description_: "",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability): void => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[0];
                    let dy = nearestEnemyPos[1] - posY[0];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[0], posY[0], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_STAR,
        name_: "The Star",
        description_: "",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability): void => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[0];
                    let dy = nearestEnemyPos[1] - posY[0];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[0], posY[0], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_MOON,
        name_: "The Moon",
        description_: "",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability): void => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[0];
                    let dy = nearestEnemyPos[1] - posY[0];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[0], posY[0], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_SUN,
        name_: "The Sun",
        description_: "",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability): void => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[0];
                    let dy = nearestEnemyPos[1] - posY[0];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[0], posY[0], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_JUDGE,
        name_: "Judgement",
        description_: "",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability): void => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[0];
                    let dy = nearestEnemyPos[1] - posY[0];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[0], posY[0], vx, 0, 10, 5, 5, 999);
                }
            });
        },
    }, {
        id_: UP_WORLD,
        name_: "The World",
        description_: "",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_MAGI, BULLET, 1000, (a: Ability): void => {
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[0];
                    let dy = nearestEnemyPos[1] - posY[0];
                    let dist = sqrt(dx * dx + dy * dy);
                    let speed = 300;
                    let vx = (dx / dist) * speed;
                    let vy = (dy / dist) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 10, 5, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -300 : 300;
                    spawnProjectile(posX[0], posY[0], vx, 0, 10, 5, 5, 999);
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
        player.abilities_.push({ id_, type_, level_: 1, cooldown_, timer_: 0, fire_, entityId_: -1 });
    }
};

export let getRandomUpgrades = (n: number): Upgrade[] => {
    let available = UPGRADE_POOL.filter(upg => {
        if (upg.kind_ === ABILITY) {
            let ability = player.abilities_.find(a => a.id_ === upg.id_);
            return (!ability && player.abilities_.length < 3) || (ability && ability.level_ < 5);
        }
        return true;
    });
    let choices: Upgrade[] = [];
    for (let i = 0; i < n && available.length > 0; i++) {
        let idx = randInt(0, available.length - 1);
        choices.push(available[idx]);
        available.splice(idx, 1);
    }
    return choices;
};

export let updatePlayerAbilities = (delta: number): void => {
    for (let ability of player.abilities_) {
        if (ability.timer_ <= 0) {
            ability.fire_(ability);
            ability.timer_ += ability.cooldown_ * (1 - (0.01 * player.cooldown_));
        }
        ability.timer_ -= delta;
    }
};
