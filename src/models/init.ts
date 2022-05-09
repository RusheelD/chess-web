import { Board, UserContext } from "./core";
import {default as pieces} from "../components/boards/initial.json";

function initializeBoard(): Board {

    return {
        tiles: [],
        pieces: [],
        selectedTile: undefined
    };
}

function initialize(): UserContext {
    const userContext: UserContext = {
        gameContext: {
            game: {
                moves: [],
                firstPlayer: {
                    name: "Russel",
                    colorChosen: "white",
                    isComputer: false
                },
                secondPlayer: {
                    name: "Wilson",
                    colorChosen: "black",
                    isComputer: false
                }
            },
            board: initializeBoard()
        }
    }

    return userContext;
}

export const userContext = initialize();
