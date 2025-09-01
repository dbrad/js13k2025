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
    GS_RUNCOUNT: number,
    GS_RUNTIME: number,
    GS_MUTEMUSIC: number,
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
    draw_: VoidFunction,
    drawGUI_: VoidFunction,
};

type Ability = {
    id_: number;
    type_: number;
    level_: number;
    cooldown_: number;
    timer_: number;
    fire_: (a: Ability) => void;
    entityId_: number;
};

type Upgrade = {
    id_: number;
    name_: string;
    description_: string;
    kind_: typeof STAT | typeof ABILITY;
    apply_: () => void;
};

type Player = {
    hp_: number;
    maxHP_: number;
    shield_: number;
    speed_: number;
    dash_: number;
    onDash_: VoidFunction;
    stealthed_: number;
    stealthedMax_: number;
    bonus_: number;
    bonusMax_: number;
    damage_: number;
    defense_: number;
    cooldown_: number;
    abilities_: Ability[];
    xp_: number;
    level_: number;
    levelUpPending_: boolean;
};
