declare var DEBUG: boolean;

declare module '*.vert' {
    let content: string;
    export default content;
}

declare module '*.frag' {
    let content: string;
    export default content;
}

declare module '*.txt' {
    let content: string;
    export default content;
}

declare module '*.webp' {
    let content: string;
    export default content;
}

type GameState = [
    GS_TIME: number,
    GS_LEVELUP_PENDING: number,
];

type TextureDefinition = [number, number[], number, number, number, number];

type Texture = {
    w_: number,
    h_: number,
    u0_: number,
    v0_: number,
    u1_: number,
    v1_: number,
};

type TextureCache = Texture[];

type DrawCall = {
    x_: number,
    y_: number,
    w_: number,
    h_: number,
    sx_: number,
    sy_: number,
    u0_: number,
    v0_: number,
    u1_: number,
    v1_: number,
    colour_: number,
    hFlip_: boolean,
    vFlip_: boolean,
};

type V2 = [number, number];
type V3 = [number, number, number];
type V4 = [number, number, number, number];

type V2f = Float32Array;
type V3f = Float32Array;
type V4f = Float32Array;

type UpdateFunction = (delta: number) => void;

type Scene = {
    id_: number,
    setup_: VoidFunction,
    update_: UpdateFunction,
    draw_: UpdateFunction,
    drawGUI_: UpdateFunction,
};

type PlayerStats = {
    hp_: number;
    maxHP_: number;
    speed_: number;
    damage_: number;
    defense_: number;
    fireRate_: number;
    projectileSpeed_: number;
    aoeSize_: number;
};

type Ability = {
    id_: string;
    type_: "bullet" | "aura";
    level_: number;
    cooldown_: number;
};

type Upgrade = {
    id_: string;
    name_: string;
    description_: string;
    kind_: "stat" | "ability";
    weight_: number; // higher = more common
    maxLevel_?: number;
    apply_: (player: Player) => void;
};

type Player = {
    stats_: PlayerStats;
    luck_: number;
    abilities_: Ability[];
    xp_: number;
    level_: number;
};
