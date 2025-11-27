# WebSocket Events

Namespace: default `/`

Authentication: Socket.IO `auth.token` must contain a valid JWT.

## From Client

- `queue:status`
  - Payload: none
  - Response: `queue:status` echo ({ ok: true })

- `match:join`
  - Payload: `{ matchId: string }`
  - Server: joins room and responds with `match:joined`

- `input`
  - Payload: `{ matchId: string, seq: number, input: PlayerInput }`
  - PlayerInput:
    - `moveX`: -1..1
    - `moveY`: -1..1
    - `shoot`: boolean
    - `targetId`: string | null
    - `headshot`: boolean

- `match:forfeit`
  - Payload: `{ matchId: string }`

## From Server

- `queue:status`
  - Payload: `{ ok: true }`

- `match:joined`
  - Payload: `{ matchId: string }`

- `match:start`
  - Payload: `{ matchId: string, snapshot: MatchSnapshot }`

- `match:state`
  - Payload: `MatchSnapshot`

- `match:end`
  - Payload: `{ matchId: string, reason: string, score: { A: number, B: number } }`

MatchSnapshot:

- `id`: match id
- `mode`: string
- `ranked`: boolean
- `state`: "playing" | "ended"
- `score`: `{ A: number, B: number }`
- `players[]`:
  - `id`
  - `team`
  - `position` (`{ x, y }`)
  - `hp`
  - `kills`
  - `deaths`
  - `isBot`
  - `disconnected`
- `domination`:
  - `zones[]` (`{ id, owner }`)
