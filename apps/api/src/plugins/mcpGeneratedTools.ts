// AUTO-GENERATED. DO NOT EDIT MANUALLY.
export type GeneratedMcpParam = {
  type: 'string' | 'boolean' | 'integer' | 'number' | 'array' | 'object'
  required: boolean
  description?: string
}
export type GeneratedMcpTool = {
  name: string
  description: string
  method: 'get' | 'post' | 'put' | 'patch' | 'delete'
  path: string
  params: Record<string, GeneratedMcpParam>
}
export const generatedMcpTools: GeneratedMcpTool[] = 
[
  {
    "name": "eden_v3_sessions_prompt",
    "description": "Prompt a session (non-streaming)",
    "method": "post",
    "path": "/v3/sessions/prompt",
    "params": {
      "session_run_id": {
        "type": "string",
        "required": false
      },
      "session_id": {
        "type": "string",
        "required": false
      },
      "actor_agent_ids": {
        "type": "array",
        "required": false
      },
      "thinking": {
        "type": "boolean",
        "required": false
      },
      "creation": {
        "type": "object",
        "required": false
      },
      "message": {
        "type": "object",
        "required": true
      }
    }
  }
]
