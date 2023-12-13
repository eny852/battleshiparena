import { useEffect, useState } from "react";
import { FireResponse } from "./types/types";
import { FaSquareFull, FaWater, FaQuestion } from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import styles from "./BattleShipGame.module.css";

function BattleShipGameBrainDead() {
  const token =
    "UCsY56uF9VVpMsay7ICgjKK1Q5i2.pXfx31yliybQN7UjyHyjV9oAOAqMNBvtVIuMqx7Q3eZNgM1aGLSfs23xxRqhhxy0oM15IrX4X0GooubIMYL6gAQqgqEn8X7IAOgJuWpG2TbDTk7cMhAnIIgWImPso21nnQFGHyclqbtYbkt99KGju8S03NqfnbhGgl8GOiXpEyC0y8wW5HynUDSJEgJb0KjnwImshnmOtENQn22qb35wp6rkkagBbVGaMF6HCYzIiA9BMhDBRh2VG1ofhXj4YdzC";
  const [fireResponse, setFireResponse] = useState<FireResponse>();
  const [playGround, setPlayGround] = useState<string[]>([]);
  const [play, setPlay] = useState<boolean>(true);
  // const [stop, setStop] = useState<boolean>(false);
  const [change, setChange] = useState<{ x: number; y: number }>();

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
    if (x < 0 || y < 0) return false;

    return playGround.at(x)?.charAt(y) === "*";
  }

  async function fireAtCoordinates(x: number, y: number) {
    if (fireResponse?.avengerAvailable) {
      const res = await fireWithAvenger(x, y);
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

    console.log(`fired at: ${x} ${y}, data: `, data);
    setChange({ x, y });
    setFireResponse(data);

    setPlayGround(splitStringEveryN(data.grid, 12));
    return data;
  }

  async function checkHitAndSurrounded() {
    for (let i = 0; i < playGround.length; i++) {
      for (let j = 0; j < playGround[i].length; j++) {
        if (playGround[i][j] === "X") {
          if (isValidTarget(i, j - 1)) {
            const res = await fireAtCoordinates(i, j - 1);
            return res;
          }
          if (isValidTarget(i, j + 1)) {
            const res = await fireAtCoordinates(i, j + 1);
            return res;
          }
          if (isValidTarget(i - 1, j)) {
            const res = await fireAtCoordinates(i - 1, j);
            return res;
          }
          if (isValidTarget(i + 1, j)) {
            const res = await fireAtCoordinates(i + 1, j);
            return res;
          }
        }
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

    console.log(`fired at: ${x} ${y}, data: `, data);
    setChange({ x, y });
    setFireResponse(data);

    setPlayGround(splitStringEveryN(data.grid, 12));

    return data;
  }

  async function fireAtRandom() {
    // if (stop) return;

    if (fireResponse?.avengerAvailable) {
      console.log("AVENGERI SU READYYYYYY");
    }

    let res = await checkHitAndSurrounded();

    if (res) {
      setPlay(true);
      return;
    }

    const randoms = getRandomPosition();

    res = await fireAtCoordinates(randoms.rand1, randoms.rand2);

    //await new Promise((r) => setTimeout(r, 2000));

    if (res.cell !== "X") {
      console.log("Netrafil som...");
      setPlay(true);
      return;
    }

    console.log("TREFA!");
    setPlay(true);
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

    console.log(data);
    setFireResponse(data);
    setPlayGround(splitStringEveryN(data.grid, 12));

    //await new Promise((r) => setTimeout(r, 100));
    return data.result;
  }

  async function playGame() {
    await fireAtRandom();
    await new Promise((r) => setTimeout(r, 2000));
  }

  useEffect(() => {
    getFire();
  }, []);

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
        disabled={!play}
        onClick={async () => {
          setPlay(false);
          await playGame();
        }}
      >
        Play
      </button>
      {/* <button
        disabled={play}
        onClick={() => {
          setStop(true);
          setPlay(true);
        }}
      >
        Stop
      </button> */}
    </>
  );
}

export default BattleShipGameBrainDead;
