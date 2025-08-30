import { BLACK } from "./draw";
import { findNearestEnemy, nearestEnemyPos, playerDir, posX, posY, spawnAura, spawnProjectile } from "./entity";
import { calcVec, cos, max, min, PI, randInt, random, roundTo, sin, vecCalc } from "./math";
import { burstParticle, emitParticle } from "./particle";

export let player: Player;

export let resetPlayer = (): void => {
    player = {
        hp_: 100,
        maxHP_: 100,
        shield_: 0,
        speed_: 140,
        damage_: 0,
        defense_: 0,
        cooldown_: 0,
        luck_: 0,
        abilities_: [],
        xp_: 0,
        level_: 1,
        levelUpPending_: true
    };
    UPGRADE_POOL[UP_CLAW].apply_();
};

export let xpTable: number[] = Array.from({ length: 30 }, (_, i) => roundTo(10 * (1.5 ** (i - 1)), 5));

export let gainXp = (val: number): void => {
    player.xp_ += val;
    let nextLevel = xpTable[player.level_];
    if (player.xp_ >= nextLevel) {
        player.xp_ -= nextLevel;
        player.level_ += 1;
        player.levelUpPending_ = true;
    }
};

export let UPGRADE_POOL: Upgrade[] = [
    {
        id_: UP_HP,
        name_: "Vitality",
        description_: "+20 Max HP",
        kind_: STAT,
        apply_: (): void => { player.maxHP_ += 20; player.hp_ += 20; },
    }, {
        id_: UP_ATK,
        name_: "Ferocity",
        description_: "+1 Damage",
        kind_: STAT,
        apply_: (): void => { player.damage_ += 1; },
    }, {
        id_: UP_DEF,
        name_: "Fortify",
        description_: "+1 Armor",
        kind_: STAT,
        apply_: (): void => { player.defense_ += 1; },
    }, {
        id_: UP_CD,
        name_: "Frequency",
        description_: "+5% Firerate",
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
                    calcVec(posX[0], posY[0], nearestEnemyPos[X], nearestEnemyPos[Y]);
                    let vx = vecCalc[NX] * speed;
                    let vy = vecCalc[NY] * speed;
                    let perpX = -vecCalc[NY] * 10;
                    let perpY = vecCalc[NX] * 10;
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
        id_: UP_ZOOMY,
        name_: "The Zoomies",
        description_: "Attack in random directions|upgrade: projectiles+",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_ZOOMY, BULLET, 250, (a: Ability): void => {
                for (let i = 0; i < a.level_; i++) {
                    let a = random() * PI * 2;
                    let speed = randInt(150, 200);
                    let vx = cos(a) * speed;
                    let vy = sin(a) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 3, 2, 2);
                }
            });
        },
    }, {
        id_: UP_HAIRBALL,
        name_: "Hairball",
        description_: "Let out a powerful piercing attack|upgrade: damage+ size+",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_HAIRBALL, BULLET, 2000, (a: Ability): void => {
                let speed = 300;
                let dmg = 10 * a.level_;
                let size = 5 * a.level_;
                if (findNearestEnemy(300)) {
                    calcVec(posX[0], posY[0], nearestEnemyPos[X], nearestEnemyPos[Y]);
                    let vx = vecCalc[NX] * speed;
                    let vy = vecCalc[NY] * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, size, dmg, 5, 999);
                } else {
                    let vx = playerDir === 0 ? -speed : speed;
                    spawnProjectile(posX[0], posY[0], vx, 0, size, dmg, 5, 999);
                }
            });
        },
    }, {
        id_: UP_MENACE,
        name_: "Menacing Pressence",
        description_: "Slow nearby enemies|upgrade: slow+ size+",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_MENACE, AURA, 5000, (a: Ability): void => {
                let slow = max(0.7 - (a.level_ - 1) * 0.1, 0.3);
                let radius = 50 + a.level_ * 10;
                a.entityId_ = spawnAura(radius, 0, -1, 0x11ff8888, slow, a.entityId_);
            });
        },
    }, {
        id_: UP_NINELIFE,
        name_: "Nine Lives",
        description_: "Slowly regenerate health|upgrade: frequency+",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_NINELIFE, PASSIVE, 5000, (a: Ability): void => {
                a.cooldown_ = 5000 - (1000 * (a.level_ - 1));
                player.hp_ = min(player.maxHP_, player.hp_ + 1);
            });
        },
    }, {
        id_: UP_CARDINAL,
        name_: "Cardinal Assault",
        description_: "Attack in the 4 cardinal directions|upgrade: pierce+ size+",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_CARDINAL, BULLET, 1000, (a: Ability): void => {
                let speed = 300;
                spawnProjectile(posX[0], posY[0], speed, 0, 1 + a.level_, 1, 2, a.level_);
                spawnProjectile(posX[0], posY[0], -speed, 0, 1 + a.level_, 1, 2, a.level_);
                spawnProjectile(posX[0], posY[0], 0, speed, 1 + a.level_, 1, 2, a.level_);
                spawnProjectile(posX[0], posY[0], 0, -speed, 1 + a.level_, 1, 2, a.level_);
            });
        },
    }, {
        id_: UP_SLASH,
        name_: "Slash",
        description_: "Slash at nearby enemies in an arc|upgrade: count+ size+",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_SLASH, BULLET, 500, (a: Ability): void => {
                let count = 5 + a.level_ * 6;
                let ang = PI / (6 - a.level_);
                let baseAngle: number;
                let dx: number, dy: number;

                if (findNearestEnemy(300)) {
                    dx = nearestEnemyPos[0] - posX[0];
                    dy = nearestEnemyPos[1] - posY[0];
                    baseAngle = Math.atan2(dy, dx);
                } else {
                    baseAngle = playerDir === 0 ? PI : 0;
                }

                for (let i = 0; i < count; i++) {
                    let t = i / (count - 1);
                    let angle = baseAngle - ang / 2 + t * ang;
                    let px = posX[0] + cos(angle) * 64;
                    let py = posY[0] + sin(angle) * 64;
                    spawnProjectile(px, py, 0, 0, a.level_, 1, .1, 999);
                    burstParticle.position_[X] = px;
                    burstParticle.position_[Y] = py;
                    emitParticle(burstParticle);
                }
            });
        },
    }, {
        id_: UP_SHED,
        name_: "Agressive Shedding",
        description_: "Periodically attack in all directions|upgrade: count+",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_SHED, BULLET, 3000, (a: Ability): void => {
                let speed = 300;
                let count = 4 + a.level_ * 4;
                for (let k = 0; k < 8 + count; k++) {
                    let angle = (2 * PI * k) / count;
                    let vx = cos(angle) * speed;
                    let vy = sin(angle) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 2, 1, 2, 1);
                }
            });
        },
    }, {
        id_: UP_FELD1,
        name_: "Fel d 1",
        description_: "A damaging aura of allergens|upgrade: size+",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_FELD1, AURA, 5000, (a: Ability): void => {
                let radius = 50 + a.level_ * 10;
                a.entityId_ = spawnAura(radius, 1 + player.damage_, -1, 0x668888ff, 1, a.entityId_);
            });
        },
    }, {
        id_: UP_REFLEX,
        name_: "Extreme Reflexes",
        description_: "Periodically nullify an incoming attack|upgrade: cooldown-",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_REFLEX, PASSIVE, 10000, (a: Ability): void => {
                player.shield_ = min(1, player.shield_ + 1);
            });
        },
    }, {
        id_: UP_HISS,
        name_: "Hiss",
        description_: "Knock back and harm nearby enemies|upgrade: count+ knock+",
        kind_: ABILITY,
        apply_: (): void => {
            upgradeAbility(UP_HISS, BULLET, 1500, (a: Ability): void => {
                let count = 8 + a.level_ * 4;
                let ang = PI / 4;
                let baseAngle: number;
                if (findNearestEnemy(300)) {
                    let dx = nearestEnemyPos[0] - posX[0];
                    let dy = nearestEnemyPos[1] - posY[0];
                    baseAngle = Math.atan2(dy, dx);
                } else {
                    baseAngle = playerDir === 0 ? PI : 0;
                }
                let speed = 500;
                let kb = 10 + a.level_ * 5;
                for (let i = 0; i < count; i++) {
                    let t = count > 1 ? i / (count - 1) : 0.5;
                    let angle = baseAngle - ang / 2 + t * ang;
                    angle += (random() - 0.5) * (PI / 12);
                    let vx = cos(angle) * speed;
                    let vy = sin(angle) * speed;
                    spawnProjectile(posX[0], posY[0], vx, vy, 2, 1, .2, 1, BLACK, false, kb);
                }
            });
        },
    },
];

let upgradeAbility = (id_: number, type_: number, cooldown_: number, fire_: (ability: Ability) => void): void => {
    let existing = player.abilities_.find(a => a.id_ === id_);
    if (existing) {
        existing.level_++;
        existing.timer_ = 0;
    } else {
        player.abilities_.push({ id_, type_, level_: 1, cooldown_, timer_: 0, fire_, entityId_: -1 });
    }
};

export let getRandomUpgrades = (n: number, skipStats: boolean = false): Upgrade[] => {
    let available = UPGRADE_POOL.filter(upg => {
        if (upg.kind_ === STAT && skipStats) {
            return false;
        } else if (upg.kind_ === ABILITY) {
            let ability = player.abilities_.find(a => a.id_ === upg.id_);
            return (!ability && player.abilities_.length < 4) || (ability && ability.level_ < 5);
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
            ability.timer_ += ability.cooldown_ * (100 / (100 + player.cooldown_));
        }
        ability.timer_ -= delta;
    }
};
