import { useEffect, useState, useRef } from "react";
import { Coordinate, FireResponse, HuntingMode } from "./types/types";
import { FaSquareFull, FaWater, FaQuestion } from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import styles from "./BattleShipGame.module.css";

function BattleShipGame() {
  const token =
    "qCL1ViPWuXOE8IwHkFkrONuA6nq1.ttbBKPuHmooYm7hCKxHJiZJmFtize9S1NnzH5QUHOzDodHnRY4YwSfOaft4SSEtvAVdkLJj7jEGckQNl1bptlihWkaMrFr4nKtVpxTId9jwJpSEFkBabwgv0wWE77VI4JSqWtVns6YWUxd0QROObALIoEC30bA9MIyrpR5So7VWMCLDY1ULGV97C8rhCDTEEbHvoRjEOE9lrrRDh3vxWNSIVqJlUbiYMb1Drw5G76UGeXYMkBY8RaEPjzBs53Eva";
  const [fireResponse, setFireResponse] = useState<FireResponse>();
  const [playGround, setPlayGround] = useState<string[]>([]);
  const [play, setPlay] = useState<boolean>(false);
  const [stop, setStop] = useState<boolean>(false);
  const [change, setChange] = useState<Coordinate>();
  //const [huntingMode, setHuntingMode] = useState<HuntingMode>();
  const huntingMode = useRef<HuntingMode>();
  const sunkShips = useRef<Coordinate[]>([]);
  const avengerResult = useRef<Coordinate[]>([]);
  const isHelicarrierDestroyed = useRef<boolean>(false);
  const moveCountTotal = useRef<number>(0);

  const emptyGrid =
    "************************************************************************************************************************************************";

  function randomNumber12() {
    return Math.floor(Math.random() * 12);
  }

  function getRandomPosition() {
    let rand1 = randomNumber12();
    let rand2 = randomNumber12();

    while (!isValidTarget(rand1, rand2)) {
      rand1 = randomNumber12();
      rand2 = randomNumber12();
    }

    return { rand1, rand2 };
  }

  function splitStringEveryN(str: string, n: number) {
    const result = [];
    for (let i = 0; i < str?.length; i += n) {
      result.push(str.substring(i, i + n));
    }
    return result;
  }

  function isValidTarget(x: number, y: number) {
    if (x < 0 || y < 0 || x > 11 || y > 11) return false;

    let closeShooting = false;
    sunkShips.current.forEach((point) => {
      if (
        (huntingMode.current === undefined || !huntingMode.current.direction) &&
        ((x === point.x - 1 && y === point.y) ||
          (x === point.x + 1 && y === point.y) ||
          (x === point.x && y === point.y - 1) ||
          (x === point.x && y === point.y + 1) ||
          (x === point.x + 1 && y === point.y + 1) ||
          (x === point.x - 1 && y === point.y - 1) ||
          (x === point.x + 1 && y === point.y - 1) ||
          (x === point.x - 1 && y === point.y + 1) ||
          (x === point.x && y === point.y))
      ) {
        closeShooting = true;
      }
    });

    if (closeShooting) return false;

    return playGround.at(x)?.charAt(y) === "*";
  }

  function isShip(x: number, y: number) {
    if (x < 0 || y < 0 || x > 11 || y > 11) return false;

    return playGround.at(x)?.charAt(y) === "X";
  }

  function isEndingChar(x: number, y: number) {
    let closeShooting = false;
    sunkShips.current.forEach((point) => {
      if (
        (x === point.x - 1 && y === point.y) ||
        (x === point.x + 1 && y === point.y) ||
        (x === point.x && y === point.y - 1) ||
        (x === point.x && y === point.y + 1) ||
        (x === point.x + 1 && y === point.y + 1) ||
        (x === point.x - 1 && y === point.y - 1) ||
        (x === point.x + 1 && y === point.y - 1) ||
        (x === point.x - 1 && y === point.y + 1) ||
        (x === point.x && y === point.y)
      ) {
        closeShooting = true;
      }
    });

    if (closeShooting) return true;

    return (
      playGround.at(x)?.charAt(y) === "." || x < 0 || x > 11 || y < 0 || y > 11
    );
  }

  async function fireAtCoordinates(x: number, y: number) {
    if (fireResponse?.grid !== emptyGrid && fireResponse?.avengerAvailable) {
      const res = await fireWithAvenger(x, y);
      avengerResult.current = res.avengerResult
        ?.filter((result) => result.hit)
        .map((resul) => {
          return { x: resul.mapPoint.x, y: resul.mapPoint.y } as Coordinate;
        })!;
      // console.log("avenger result: ", avengerResult.current);
      return res;
    }

    const response = await fetch(
      `https://europe-west1-ca-2023-dev.cloudfunctions.net/battleshipsApi/fire/${x}/${y}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = (await response.json()) as FireResponse;

    // console.log(`fired at: ${x} ${y}, data: `, data);
    setChange({ x, y });

    return data;
  }

  function sinkTheShip() {
    sunkShips.current = [...sunkShips.current, ...huntingMode.current!.hits];
    // console.log("Hunting done: ", sunkShips.current);
    huntingMode.current = undefined;
  }

  function checkIfSunk() {
    if (!huntingMode.current) {
      return false;
    }

    const sorted = huntingMode!.current?.hits
      .filter((hit) =>
        huntingMode!.current?.direction === "horizontal"
          ? hit.x === huntingMode.current?.origin.x
          : hit.y === huntingMode.current?.origin.y
      )
      .sort((a, b) =>
        huntingMode.current?.direction === "horizontal" ? a.y - b.y : a.x - b.x
      );

    // console.log(sorted);
    // console.log(huntingMode.current?.hits);

    if (huntingMode.current?.direction === "horizontal") {
      if (
        ((isEndingChar(sorted[0].x, sorted[0].y - 1) ||
          !isValidTarget(sorted[0].x, sorted[0].y - 1)) &&
          (isEndingChar(
            sorted[sorted.length - 1].x,
            sorted[sorted.length - 1].y + 1
          ) ||
            !isValidTarget(
              sorted[sorted.length - 1].x,
              sorted[sorted.length - 1].y + 1
            ))) ||
        sorted.length === 5
      ) {
        return true;
      }
    }

    if (huntingMode.current?.direction === "vertical") {
      if (
        ((isEndingChar(sorted[0].x - 1, sorted[0].y) ||
          !isValidTarget(sorted[0].x - 1, sorted[0].y)) &&
          (isEndingChar(
            sorted[sorted.length - 1].x + 1,
            sorted[sorted.length - 1].y
          ) ||
            !isValidTarget(
              sorted[sorted.length - 1].x + 1,
              sorted[sorted.length - 1].y
            ))) ||
        sorted.length === 5
      ) {
        return true;
      }
    }

    return false;
  }

  async function tryAvengerHelicarrier(direction: "horizontal" | "vertical") {
    let res = undefined;

    const sorted = huntingMode!.current?.hits
      .filter((hit) =>
        direction === "horizontal"
          ? hit.x === huntingMode.current?.origin.x
          : hit.y === huntingMode.current?.origin.y
      )
      .sort((a, b) =>
        huntingMode.current?.direction === "horizontal" ? a.y - b.y : a.x - b.x
      );

    if (sorted?.length === 3 || sorted?.length === 5) {
      res = await huntInDirection(
        sorted![1].x,
        sorted![1].y,
        direction === "horizontal" ? "vertical" : "horizontal",
        sorted?.length === 3 ? undefined : 1
      );

      if (
        !res &&
        huntingMode!.current?.hits.length! >= 7 &&
        huntingMode!.current?.hits.length! <= 8
      ) {
        let dir;
        let fiveInARow = [] as Coordinate[];

        if (sorted?.length === 3) {
          fiveInARow = huntingMode!.current?.hits
            .filter((hit) =>
              direction === "horizontal"
                ? hit.y === sorted![1].y
                : hit.x === sorted![1].x
            )
            .sort((a, b) =>
              huntingMode.current?.direction === "vertical"
                ? a.y - b.y
                : a.x - b.x
            ) as Coordinate[];
          dir = direction === "horizontal" ? "horizontal" : "vertical";
        }
        if (sorted?.length === 5) {
          fiveInARow = sorted;
          dir = direction === "horizontal" ? "vertical" : "horizontal";
        }
        res = await huntInDirection(
          fiveInARow![1].x,
          fiveInARow![1].y,
          dir === "horizontal" ? "horizontal" : "vertical",
          1
        );
        if (!res) {
          res = await huntInDirection(
            fiveInARow![3].x,
            fiveInARow![3].y,
            dir === "horizontal" ? "horizontal" : "vertical",
            1
          );
        }
      }

      if (huntingMode!.current?.hits.length! == 9) {
        isHelicarrierDestroyed.current = true;
      }

      if (res?.cell === "X" || huntingMode.current?.isAvenger) {
        //console.log("Nasiel som ta ty Avenger");
        if (res?.cell === "X")
          huntingMode.current = { ...huntingMode.current!, isAvenger: true };

        return res;
      }
    }
    huntingMode.current = { ...huntingMode.current!, isAvenger: false };
    return res;
  }

  function coordInHuntingHits(x: number, y: number) {
    return huntingMode?.current!.hits.some((hit) => hit.x === x && hit.y === y);
  }

  async function huntInDirection(
    x: number,
    y: number,
    direction: "horizontal" | "vertical",
    maxDistance?: number | undefined
  ) {
    let counter = 1;
    let res = undefined;

    let hitCounterInDirection = 1;
    let distCounter = maxDistance || undefined;

    if (direction === "horizontal") {
      while (!isEndingChar(x, y - counter)) {
        if (distCounter === 0) break;

        if (isShip(x, y - counter)) {
          hitCounterInDirection++;
          if (hitCounterInDirection === 5) break;

          if (!coordInHuntingHits(x, y - counter)) {
            huntingMode.current = {
              ...huntingMode.current!,
              hits: [...huntingMode?.current!.hits, { x, y: y - counter }],
            };
          }
        }

        if (isValidTarget(x, y - counter)) {
          res = await fireAtCoordinates(x, y - counter);
          if (res.cell === "X") {
            huntingMode.current = {
              ...huntingMode.current!,
              hits: [...huntingMode?.current!.hits, { x, y: y - counter }],
            };
          }
          return res;
        }
        counter++;
        if (distCounter) distCounter--;
      }
      counter = 1;
      distCounter = maxDistance || undefined;

      while (!isEndingChar(x, y + counter)) {
        if (distCounter === 0) break;

        if (isShip(x, y + counter)) {
          hitCounterInDirection++;
          if (hitCounterInDirection === 5) break;

          if (!coordInHuntingHits(x, y + counter)) {
            huntingMode.current = {
              ...huntingMode.current!,
              hits: [...huntingMode?.current!.hits, { x, y: y + counter }],
            };
          }
        }
        if (isValidTarget(x, y + counter)) {
          res = await fireAtCoordinates(x, y + counter);
          if (res.cell === "X") {
            huntingMode.current = {
              ...huntingMode.current!,
              hits: [...huntingMode?.current!.hits, { x, y: y + counter }],
            };
          }
          return res;
        }
        counter++;
        if (distCounter) distCounter--;
      }
    }

    if (direction === "vertical") {
      while (!isEndingChar(x - counter, y)) {
        if (distCounter === 0) break;

        if (isShip(x - counter, y)) {
          hitCounterInDirection++;
          if (hitCounterInDirection === 5) break;

          if (!coordInHuntingHits(x - counter, y)) {
            huntingMode.current = {
              ...huntingMode.current!,
              hits: [...huntingMode?.current!.hits, { x: x - counter, y }],
            };
          }
        }
        if (isValidTarget(x - counter, y)) {
          res = await fireAtCoordinates(x - counter, y);
          if (res.cell === "X") {
            huntingMode.current = {
              ...huntingMode.current!,
              hits: [...huntingMode?.current!.hits, { x: x - counter, y }],
            };
          }
          return res;
        }
        counter++;
        if (distCounter) distCounter--;
      }
      counter = 1;
      distCounter = maxDistance || undefined;

      while (!isEndingChar(x + counter, y)) {
        if (distCounter === 0) break;

        if (isShip(x + counter, y)) {
          hitCounterInDirection++;
          if (hitCounterInDirection === 5) break;

          if (!coordInHuntingHits(x + counter, y)) {
            huntingMode.current = {
              ...huntingMode.current!,
              hits: [...huntingMode?.current!.hits, { x: x + counter, y }],
            };
          }
        }
        if (isValidTarget(x + counter, y)) {
          res = await fireAtCoordinates(x + counter, y);
          if (res.cell === "X") {
            huntingMode.current = {
              ...huntingMode.current!,
              hits: [...huntingMode?.current!.hits, { x: x + counter, y }],
            };
          }
          return res;
        }
        counter++;
        if (distCounter) distCounter--;
      }
    }

    return res;
  }

  async function getDirection(i: number, j: number) {
    if (isValidTarget(i, j - 1)) {
      const res = await fireAtCoordinates(i, j - 1);
      if (res.cell === "X")
        huntingMode.current = {
          ...huntingMode.current!,
          hits: [...huntingMode?.current!.hits, { x: i, y: j - 1 }],
          direction: "horizontal",
        };
      return res;
    }
    if (isValidTarget(i, j + 1)) {
      const res = await fireAtCoordinates(i, j + 1);
      if (res.cell === "X")
        huntingMode.current = {
          ...huntingMode.current!,
          hits: [...huntingMode?.current!.hits, { x: i, y: j + 1 }],
          direction: "horizontal",
        };
      return res;
    }
    if (isValidTarget(i - 1, j)) {
      const res = await fireAtCoordinates(i - 1, j);
      if (res.cell === "X")
        huntingMode.current = {
          ...huntingMode.current!,
          hits: [...huntingMode?.current!.hits, { x: i - 1, y: j }],
          direction: "vertical",
        };
      return res;
    }
    if (isValidTarget(i + 1, j)) {
      const res = await fireAtCoordinates(i + 1, j);
      if (res.cell === "X")
        huntingMode.current = {
          ...huntingMode.current!,
          hits: [...huntingMode?.current!.hits, { x: i + 1, y: j }],
          direction: "vertical",
        };
      return res;
    }

    if (isShip(i, j - 1)) {
      huntingMode.current = {
        ...huntingMode.current!,
        direction: "horizontal",
      };
    }
    if (isShip(i, j + 1)) {
      huntingMode.current = {
        ...huntingMode.current!,
        direction: "horizontal",
      };
    }
    if (isShip(i - 1, j)) {
      huntingMode.current = {
        ...huntingMode.current!,
        direction: "vertical",
      };
    }
    if (isShip(i + 1, j)) {
      huntingMode.current = {
        ...huntingMode.current!,
        direction: "vertical",
      };
    }

    return undefined;
  }

  async function huntTheShip() {
    let res;

    const sunk = checkIfSunk();
    //console.log("sunk ? ", sunk);

    if (sunk) {
      if (
        (!isHelicarrierDestroyed.current &&
          (huntingMode.current!.hits.length === 5 ||
            huntingMode.current!.hits.length === 3) &&
          huntingMode.current?.isAvenger === undefined) ||
        huntingMode.current?.isAvenger
      ) {
        res = await tryAvengerHelicarrier(huntingMode.current!.direction!);
        if (res) return res;
      }

      sinkTheShip();
      return undefined;
    }

    const i = huntingMode.current?.origin.x!;
    const j = huntingMode.current?.origin.y!;

    if (isShip(i, j)) {
      if (!huntingMode.current?.direction) {
        //fire at surrounded if no X around
        res = await getDirection(i, j);
        return res;
      }

      if (huntingMode.current?.direction) {
        res = await huntInDirection(i, j, huntingMode.current?.direction);
        if (res) return res;
      }
    }

    return undefined;
  }

  async function fireWithAvenger(x: number, y: number) {
    //     Thor can reveal 11 spaces at once with his lightning. The one you’re firing at + 10 random spaces. All in a single turn.
    //     Hulk can sink a whole ship at once. If you fire at a space with an actual ship and ask Hulk for help, he’ll destroy the entire ship.
    //     Iron Man will use his scanners to reveal the smallest undiscovered ship.

    const response = await fetch(
      `https://europe-west1-ca-2023-dev.cloudfunctions.net/battleshipsApi/fire/${x}/${y}/avenger/thor`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = (await response.json()) as FireResponse;

    //console.log(`fired at: ${x} ${y}, data: `, data);
    setChange({ x, y });

    return data;
  }

  async function fireAtRandom() {
    let res;

    if (fireResponse?.avengerAvailable) {
      // console.log("AVENGERI SU READYYYYYY");
    }

    if (huntingMode.current) {
      res = await huntTheShip();

      if (res) {
        setPlay(true);
        return res;
      }
    }

    if (avengerResult.current.length && !huntingMode.current) {
      const revealedCoord = avengerResult.current.pop();
      //console.log("revealedCoord: ", revealedCoord);
      let skip = false;

      if (
        sunkShips.current.some(
          (coord) =>
            coord.x === revealedCoord?.x && coord.y === revealedCoord?.y
        )
      ) {
        skip = true;
      }

      if (revealedCoord && !skip) {
        huntingMode.current = {
          origin: { x: revealedCoord?.x, y: revealedCoord?.y },
          hits: [{ x: revealedCoord?.x, y: revealedCoord?.y }],
          isAvenger: undefined,
        };
        res = await huntTheShip();
        if (res) {
          setPlay(true);
          return res;
        }
      }
    }

    const randoms = getRandomPosition();

    res = await fireAtCoordinates(randoms.rand1, randoms.rand2);

    if (res.cell !== "X") {
      //console.log("Netrafil som...");
      setPlay(true);
      return res;
    }

    //console.log("TREFA!");

    if (!huntingMode.current) {
      huntingMode.current = {
        origin: { x: randoms.rand1, y: randoms.rand2 },
        hits: [{ x: randoms.rand1, y: randoms.rand2 }],
        isAvenger: undefined,
      };
    }

    setPlay(true);
    return res;
  }

  async function getFire() {
    const response = await fetch(
      "https://europe-west1-ca-2023-dev.cloudfunctions.net/battleshipsApi/fire",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = (await response.json()) as FireResponse;

    return data;
  }

  useEffect(() => {
    async function get() {
      if (!fireResponse) {
        const response = await getFire();
        //console.log("GET FIRE", response);
        setFireResponse(response);
      }
    }

    if (play) get();
  }, [play]);

  useEffect(() => {
    if (stop || fireResponse?.finished) {
      if (fireResponse?.finished) {
        console.log(`Game ended with total moves: ${moveCountTotal.current}`);
        moveCountTotal.current = 0;
      }
      return;
    }

    setPlayGround(splitStringEveryN(fireResponse?.grid!, 12));
  }, [fireResponse, stop]);

  useEffect(() => {
    if (fireResponse?.grid! === emptyGrid) {
      moveCountTotal.current += fireResponse?.moveCount!;
      console.log(
        `Map ID: ${fireResponse?.mapId}, move count: ${fireResponse?.moveCount}`
      );
      sunkShips.current = [];
      huntingMode.current = undefined;
      avengerResult.current = [];
      isHelicarrierDestroyed.current = false;
      setPlay(true);
    }

    async function fire() {
      const response = await fireAtRandom();
      await new Promise((r) => setTimeout(r, 50));
      if (response) setFireResponse(response);
      await new Promise((r) => setTimeout(r, 50));
    }

    if (playGround.length) fire();
  }, [playGround]);

  return (
    <>
      {fireResponse &&
        playGround.map((row, indexX) => (
          <div key={uuidv4()} className={styles.row}>
            {Array.from(row).map((cell, indexY) => (
              <p
                key={uuidv4()}
                className={`${styles.cell} ${
                  change?.x === indexX && change?.y === indexY
                    ? styles.change
                    : ""
                }`}
              >
                {cell === "X" ? (
                  <FaSquareFull />
                ) : cell === "." ? (
                  <FaWater />
                ) : (
                  <FaQuestion />
                )}
              </p>
            ))}
          </div>
        ))}
      <button
        disabled={play}
        onClick={() => {
          setPlay(true);
          setStop(false);
        }}
      >
        Play
      </button>
      <button
        disabled={!play}
        onClick={() => {
          setStop(true);
          setPlay(false);
        }}
      >
        Stop
      </button>
    </>
  );
}

export default BattleShipGame;
