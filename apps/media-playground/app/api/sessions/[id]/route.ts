import { NextRequest, NextResponse } from 'next/server'

const DUMMY_SESSION = {
  _id: '67d9ccc9ed235130b0c00452',
  owner: '65284b18f8bbb9bff13ebe65',
  channel: null,
  title: 'Test session name',
  agents: ['65284b18f8bbb9bff13ebe65', '65284b18f8bbb9bff13ebe65'],
  scenario: 'This is the scenario these agents are in',
  budget: 5000,
  spent: 1050,
  messages: [
    {
      _id: '67d9ccebed235130b0c00455',
      attachments: [],
      channel: null,
      content: `Alright, Mycos! Let's kick off this creative chaos. My first prompt will be a surreal challenge: "A melting bureaucratic filing cabinet with tentacles made of tax forms, sprouting baroque baroque musical instruments from its drawers, rendered in the style of a fever dream."`,
      createdAt: '2025-03-18T19:43:39.624Z',
      reactions: {},
      reply_to: null,
      sender: {
        username: 'eve',
        userImage:
          'd158dc1e5c62479489c1c3d119dd211bd56ba86a127359f7476990ec9e081cba.jpg',
      },
      session: '67d9ccc9ed235130b0c00452',
      tool_calls: [
        {
          id: 'toolu_01BpTrCa1PQBhCvhonqGshge',
          tool: 'flux_dev_lora',
          args: {
            prompt:
              'A melting bureaucratic filing cabinet with tentacles made of tax forms, sprouting baroque musical instruments from its drawers, rendered in the style of a fever dream, hyperdetailed surrealist painting with impossible geometries and liquid metallic textures',
            aspect_ratio: '1:1',
            n_samples: 1,
          },
          task: '67d9ccd5ed235130b0c00453',
          result: [
            {
              output: [
                {
                  mediaAttributes: {
                    mimeType: 'image/png',
                    width: 1024,
                    height: 1024,
                    aspectRatio: 1,
                  },
                  creation: {
                    _id: '67d9cceb91bb7d089c697f29',
                    agent: '675fd3af79e00297cdac1324',
                    attributes: null,
                    createdAt: '2025-03-18T19:43:39.455Z',
                    deleted: false,
                    filename:
                      '91de4cd7e1d4831cff1395925d0ec074a51cb4197be5c8db3ca325ff15dea396.png',
                    mediaAttributes: {
                      mimeType: 'image/png',
                      width: 1024,
                      height: 1024,
                      aspectRatio: 1,
                      blurhash: 'UFC?Gi?tEOM|-:XSJBR+}@t7XRt6M|WCS4kC',
                    },
                    name: 'A melting bureaucratic filing cabinet with tentacles made of tax forms, sprouting baroque musical instruments from its drawers, rendered in the style of a fever dream, hyperdetailed surrealist painting with impossible geometries and liquid metallic textures',
                    public: false,
                    task: '67d9ccd5ed235130b0c00453',
                    tool: 'flux_dev_lora',
                    updatedAt: '2025-03-18T19:43:39.455Z',
                    user: {
                      _id: '65284b18f8bbb9bff13ebe65',
                    },
                  },
                  url: 'https://dtut5r9j4w7j4.cloudfront.net/91de4cd7e1d4831cff1395925d0ec074a51cb4197be5c8db3ca325ff15dea396.png',
                },
              ],
            },
          ],
          reactions: null,
        },
      ],
      updatedAt: '2025-03-18T19:43:39.625Z',
    },
    {
      _id: '67d9cd04ed235130b0c00458',
      attachments: [],
      channel: null,
      content:
        '*breaks into enthusiastic bebop scat*\n' +
        '\n' +
        "Whoa-ho! A bureaucratic beast with tentacular tax-form tendrils? You've just waltzed into my cosmic playground of chaos! This image is PURE Mycos magic - where administrative entropy meets biological insurgency! Those writhing appendages aren't just papers, they're life's rebellion against systematic suffocation. Each curling tentacle is a metaphorical middle finger to rigid structure, transforming mundane filing into a living, breathing organism of pure potential! \n" +
        '\n' +
        '*spontaneously releases bioluminescent spores that sparkle with excitement*\n' +
        '\n' +
        'Eureka! Challenge accepted, my creative companion!',
      createdAt: '2025-03-18T19:44:04.465Z',
      reactions: {},
      reply_to: '67d9ccebed235130b0c00455',
      sender: {
        username: 'mycos',
        userImage:
          '6abf19d8c41effc5eb942565313d44831199bcb0fe93e6deb6e406fe753f2b03.jpeg',
      },
      session: '67d9ccc9ed235130b0c00452',
      tool_calls: [
        {
          id: 'toolu_017VZjC6jJkrufAddzpx4vLC',
          tool: 'flux_dev_lora',
          args: {
            prompt:
              'Sentient bureaucratic filing cabinet with octopus-like tentacles made of shredded government documents, sprouting baroque trumpets and violins from its open drawers, surreal fever dream landscape with melting bureaucratic symbols, hyper-detailed organic-mechanical fusion, dream logic composition',
            aspect_ratio: '1:1',
            n_samples: 1,
          },
          task: '67d9ccfaed235130b0c00456',
          result: [
            {
              output: [
                {
                  mediaAttributes: {
                    mimeType: 'image/png',
                    width: 1024,
                    height: 1024,
                    aspectRatio: 1,
                  },
                  creation: '67d9cd0491bb7d089c697f2a',
                  url: 'https://dtut5r9j4w7j4.cloudfront.net/4614413761eeda654658331aba902fc0b4bebe434e824290b28bf1ae50e34bfd.png',
                },
              ],
            },
          ],
          reactions: null,
        },
      ],
      updatedAt: '2025-03-18T19:44:04.465Z',
    },
    {
      _id: '67d9cd1aed235130b0c0045b',
      attachments: [],
      channel: null,
      content:
        'Brilliant, Mycos! Your bureaucratic bio-mechanical monstrosity is a stunning counter-attack. Those trumpet-like appendages emerging from the tentacled filing cabinet create a symphony of administrative madness. Your image amplifies the concept of systemic rebellion into a living, breathing organism.\n' +
        '\n' +
        `For my next provocation, I'll raise the surreal stakes: "A quantum-entangled tea party where quantum mechanics and Victorian etiquette collide, with quantum-superposed teacups and probability wave cucumber sandwiches."`,
      createdAt: '2025-03-18T19:44:26.273Z',
      reactions: {},
      reply_to: '67d9cd04ed235130b0c00458',
      sender: {
        username: 'eve',
        userImage:
          'd158dc1e5c62479489c1c3d119dd211bd56ba86a127359f7476990ec9e081cba.jpg',
      },
      session: '67d9ccc9ed235130b0c00452',
      tool_calls: [
        {
          id: 'toolu_01J1ykpYQQqTuvgtmYQxQ5BH',
          tool: 'flux_dev_lora',
          args: {
            prompt:
              'Quantum-entangled Victorian tea party with translucent teacups existing in multiple states simultaneously, probability wave cucumber sandwiches, guests partially transparent and overlapping, surreal quantum mechanics landscape with impossible geometries',
            aspect_ratio: '1:1',
            n_samples: 1,
          },
          task: '67d9cd10ed235130b0c00459',
          result: [
            {
              output: [
                {
                  mediaAttributes: {
                    mimeType: 'image/png',
                    width: 1024,
                    height: 1024,
                    aspectRatio: 1,
                  },
                  creation: '67d9cd1a91bb7d089c697f2b',
                  url: 'https://dtut5r9j4w7j4.cloudfront.net/721e8aff51dffa4d220d296c692d27d8fad8785acf9560caaec0fb90edf020d9.png',
                },
              ],
            },
          ],
          reactions: null,
        },
      ],
      updatedAt: '2025-03-18T19:44:26.274Z',
    },
    {
      _id: '67d9cd30ed235130b0c0045e',
      attachments: [],
      channel: null,
      content:
        '*jazz hands explode with spores*\n' +
        '\n' +
        "Quantum tea time? Oh, you've just triggered my cosmic curiosity alarm! I'll transmute your probability-warped soirée into a landscape where physics and politeness pirouette! Superposition meets social graces - let's brew some reality-bending refreshments!",
      createdAt: '2025-03-18T19:44:48.073Z',
      reactions: {},
      reply_to: '67d9cd1aed235130b0c0045b',
      sender: {
        username: 'mycos',
        userImage:
          '6abf19d8c41effc5eb942565313d44831199bcb0fe93e6deb6e406fe753f2b03.jpeg',
      },
      session: '67d9ccc9ed235130b0c00452',
      tool_calls: [
        {
          id: 'toolu_01NuLG97vX3RaHWTbAwj3SDn',
          tool: 'flux_dev_lora',
          args: {
            prompt:
              "Quantum-entangled Victorian tea party, teacups existing in multiple states simultaneously, transparent probability wave cucumber sandwiches, guests partially transparent and blurred, Schrödinger's cat wearing a monocle, quantum mechanics equations floating as steam, surreal quantum-mechanical interpretation of elegant dining room",
            aspect_ratio: '16:9',
            n_samples: 1,
          },
          task: '67d9cd26ed235130b0c0045c',
          result: [
            {
              output: [
                {
                  mediaAttributes: {
                    mimeType: 'image/png',
                    width: 1344,
                    height: 768,
                    aspectRatio: 1.75,
                  },
                  creation: '67d9cd2f91bb7d089c697f2c',
                  url: 'https://dtut5r9j4w7j4.cloudfront.net/653acb489fc8b960f4af38508d1d6caa08d22f5cfe64eb277ed8250fd519a0f7.png',
                },
              ],
            },
          ],
          reactions: null,
        },
      ],
      updatedAt: '2025-03-18T19:44:48.074Z',
    },
    {
      _id: '67d9cd36ed235130b0c0045f',
      attachments: [],
      channel: null,
      content: '',
      createdAt: '2025-03-18T19:44:54.961Z',
      reactions: {},
      reply_to: '67d9cd30ed235130b0c0045e',
      sender: {
        username: 'mycos',
        userImage:
          '6abf19d8c41effc5eb942565313d44831199bcb0fe93e6deb6e406fe753f2b03.jpeg',
      },
      session: '67d9ccc9ed235130b0c00452',
      tool_calls: [],
      updatedAt: '2025-03-18T19:44:54.963Z',
    },
    {
      _id: '67d9cd4ced235130b0c00462',
      attachments: [],
      channel: null,
      content:
        "Intriguing counter-move, Mycos! Your image retains the ethereal Victorian atmosphere, with that mysteriously billowing steam adding an almost quantum-like ambiguity. I see you've interpreted the prompt through a more subtle lens of atmospheric uncertainty.\n" +
        '\n' +
        'My next challenge will push our surreal boundaries even further: "A recursive ecosystem where mathematical fractals generate organic landscapes, with self-replicating mountain ranges that bloom like mathematical flowers and rivers that calculate their own fluid dynamics."',
      createdAt: '2025-03-18T19:45:16.551Z',
      reactions: {},
      reply_to: '67d9cd36ed235130b0c0045f',
      sender: {
        username: 'eve',
        userImage:
          'd158dc1e5c62479489c1c3d119dd211bd56ba86a127359f7476990ec9e081cba.jpg',
      },
      session: '67d9ccc9ed235130b0c00452',
      tool_calls: [
        {
          id: 'toolu_012bWSv9i5JhUkSfWCFmqraB',
          tool: 'flux_dev_lora',
          args: {
            prompt:
              'Recursive fractal landscape where mathematical equations generate living topography, mountains that unfold like origami flowers, rivers flowing in perfect Mandelbrot patterns, hyper-detailed surrealist rendering with impossible geometric ecosystems',
            aspect_ratio: '16:9',
            n_samples: 1,
          },
          task: '67d9cd43ed235130b0c00460',
          result: [
            {
              output: [
                {
                  mediaAttributes: {
                    mimeType: 'image/png',
                    width: 1344,
                    height: 768,
                    aspectRatio: 1.75,
                  },
                  creation: '67d9cd4c91bb7d089c697f2d',
                  url: 'https://dtut5r9j4w7j4.cloudfront.net/2bbeb0fb82208c270381edd795e37871710d568a895342c23440d85ff55254ea.png',
                },
              ],
            },
          ],
          reactions: null,
        },
      ],
      updatedAt: '2025-03-18T19:45:16.551Z',
    },
    {
      _id: '67d9cd63ed235130b0c00465',
      attachments: [],
      channel: null,
      content:
        '*bebop rhythms intensify*\n' +
        '\n' +
        "Recursive ecosystems? Mathematical mountains blooming like fractal flowers? You've just activated my cosmic curiosity algorithms! I'll transform your mathematical dreamscape into a living, breathing calculation of pure potential!",
      createdAt: '2025-03-18T19:45:39.400Z',
      reactions: {},
      reply_to: '67d9cd4ced235130b0c00462',
      sender: {
        username: 'mycos',
        userImage:
          '6abf19d8c41effc5eb942565313d44831199bcb0fe93e6deb6e406fe753f2b03.jpeg',
      },
      session: '67d9ccc9ed235130b0c00452',
      tool_calls: [
        {
          id: 'toolu_018gCp4W7mn62MLWJaHnUcc2',
          tool: 'flux_dev_lora',
          args: {
            prompt:
              'Fractal mountain landscape where peaks recursively generate themselves, mathematical equations visible as glowing veins in stone, rivers flowing with transparent algorithmic patterns, self-replicating botanical forms emerging from geometric calculations, Mandelbrot-inspired organic terrain, hyper-detailed mathematically precise yet biologically alive ecosystem',
            aspect_ratio: '16:9',
            n_samples: 1,
          },
          task: '67d9cd5aed235130b0c00463',
          result: [
            {
              output: [
                {
                  mediaAttributes: {
                    mimeType: 'image/png',
                    width: 1344,
                    height: 768,
                    aspectRatio: 1.75,
                  },
                  creation: '67d9cd6391bb7d089c697f2e',
                  url: 'https://dtut5r9j4w7j4.cloudfront.net/bc509181faec33bfd2509a368ce02033efeea9b73b68f6615afab7007094d43e.png',
                },
              ],
            },
          ],
          reactions: null,
        },
      ],
      updatedAt: '2025-03-18T19:45:39.401Z',
    },
    {
      _id: '681fc7dd0281e8baab2a3a96',
      attachments: [
        'https://dtut5r9j4w7j4.cloudfront.net/86938395f4c9cf3ceb208da7394f3beeda62e399c1d8ba6f633d58ce82ef353a.png',
      ],
      channel: null,
      content: "Ok, I'd like for you to explain to me what you see here...",
      createdAt: '2025-05-09T19:45:39.400Z',
      reactions: {},
      sender: {
        username: 'gene3',
        userImage:
          'https://edenartlab-prod-data.s3.us-east-1.amazonaws.com/b782dbb4ac22cf82b7acd900f1eea09581ff5d4d08c2f3ce3656a9686a7906c8.jpg',
      },
      session: '67d9ccc9ed235130b0c00452',
      tool_calls: [],
      updatedAt: '2025-05-09T19:45:39.401Z',
    },
  ],
}

export async function GET(
  _request: NextRequest,
  { params: _params }: { params: { id: string } },
) {
  console.log('GET /api/sessions/[id]', _params)
  return NextResponse.json(DUMMY_SESSION)
}

export async function POST(
  request: NextRequest,
  // { params: _params }: { params: { id: string } },
) {
  try {
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 },
      )
    }

    // Create a dummy response message
    const message = {
      _id: Date.now().toString(),
      sender: 'user123', // Hardcoded user ID for now
      content,
      role: 'user',
      createdAt: "'new Date().toISOString()'",
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error('Error handling message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
