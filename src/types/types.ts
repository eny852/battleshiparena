export type FireResponse = {
  grid: string; //144 chars (12x12 grid) representing updated state of map, '*' is unknown, 'X' is ship, '.' is water.
  cell: string; //Result after firing at given position ('.' or 'X'). This field may be empty ('') if player calls /fire endpoint or tries to fire at already revealed position.
  result: boolean; //Denotes if fire action was valid. E.g. if player calls /fire endpoint or fire at already revealed position, this field will be false.
  avengerAvailable: boolean; //Avenger availability after the player's move.
  mapId: number; //ID of the map, on which was called last player's move. This value will change when player beats current map.
  mapCount: number; //Fixed number of maps which are required to complete before completing one full game.
  moveCount: number; //Number of valid moves which were made on the current map. Invalid moves such as firing at the same position multiple times are not included.
  finished: boolean; //Denotes if player successfully finished currently ongoing game => if player completed mapCount maps. Valid move after getting true in this field results in new game (or error if player has already achieved max number of tries).
  avengerResult?: AvengerResult[];
};

export type AvengerResult = {
  mapPoint: Coordinate;
  hit: boolean;
};

export type HuntingMode = {
  origin: Coordinate;
  hits: Coordinate[];
  isAvenger?: boolean;
  direction?: "vertical" | "horizontal";
};

export type Coordinate = {
  x: number;
  y: number;
};
