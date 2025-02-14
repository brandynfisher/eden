exports = async function () {
  const mongodb = context.services.get("Cluster1")  // or your actual cluster name
  if (!mongodb) throw new Error("Could not access MongoDB cluster")

  const db = mongodb.db("eden-stg")
  if (!db) throw new Error("Could not access database eden-stg")

  const agentCollection = db.collection("users3")
  const threadCollection = db.collection("threads3")

  const agentStats = await threadCollection.aggregate([
    {
      $facet: {
        allTime: [
          // Count messages by role, tool calls, and unique users per agent
          { $unwind: "$messages" },
          {
            $group: {
              _id: {
                agent: "$agent",
                role: "$messages.role"
              },
              messageCount: { $sum: 1 },
              toolCallCount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$messages.role", "assistant"] },
                        { $isArray: "$messages.tool_calls" }
                      ]
                    },
                    { $size: { $ifNull: ["$messages.tool_calls", []] } },
                    0
                  ]
                }
              },
              uniqueUsers: { $addToSet: "$user" }
            }
          },
          {
            $group: {
              _id: "$_id.agent",
              messageCounts: {
                $push: {
                  role: "$_id.role",
                  count: "$messageCount"
                }
              },
              toolCallCount: { $sum: "$toolCallCount" },
              uniqueUsers: { $addToSet: "$uniqueUsers" },
              threadCount: { $sum: 1 }
            }
          },
          {
            $project: {
              _id: 1,
              threadCount: 1,
              userMessageCount: {
                $reduce: {
                  input: {
                    $filter: {
                      input: "$messageCounts",
                      as: "msg",
                      cond: { $eq: ["$$msg.role", "user"] }
                    }
                  },
                  initialValue: 0,
                  in: { $add: ["$$value", "$$this.count"] }
                }
              },
              assistantMessageCount: {
                $reduce: {
                  input: {
                    $filter: {
                      input: "$messageCounts",
                      as: "msg",
                      cond: { $eq: ["$$msg.role", "assistant"] }
                    }
                  },
                  initialValue: 0,
                  in: { $add: ["$$value", "$$this.count"] }
                }
              },
              toolCallCount: 1,
              userCount: {
                $size: {
                  $filter: {
                    input: { $reduce: { input: "$uniqueUsers", initialValue: [], in: { $setUnion: ["$$value", "$$this"] } } },
                    as: "user",
                    cond: { $ne: ["$$user", null] }
                  }
                }
              }
            }
          }
        ],
        last7Days: [
          {
            $match: {
              updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
          },
          // Count messages by role, tool calls, and unique users per agent
          { $unwind: "$messages" },
          {
            $group: {
              _id: {
                agent: "$agent",
                role: "$messages.role"
              },
              messageCount: { $sum: 1 },
              toolCallCount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$messages.role", "assistant"] },
                        { $isArray: "$messages.tool_calls" }
                      ]
                    },
                    { $size: { $ifNull: ["$messages.tool_calls", []] } },
                    0
                  ]
                }
              },
              uniqueUsers: { $addToSet: "$user" }
            }
          },
          {
            $group: {
              _id: "$_id.agent",
              messageCounts: {
                $push: {
                  role: "$_id.role",
                  count: "$messageCount"
                }
              },
              toolCallCount: { $sum: "$toolCallCount" },
              uniqueUsers: { $addToSet: "$uniqueUsers" }
            }
          },
          {
            $project: {
              _id: 1,
              userMessageCount: {
                $reduce: {
                  input: {
                    $filter: {
                      input: "$messageCounts",
                      as: "msg",
                      cond: { $eq: ["$$msg.role", "user"] }
                    }
                  },
                  initialValue: 0,
                  in: { $add: ["$$value", "$$this.count"] }
                }
              },
              assistantMessageCount: {
                $reduce: {
                  input: {
                    $filter: {
                      input: "$messageCounts",
                      as: "msg",
                      cond: { $eq: ["$$msg.role", "assistant"] }
                    }
                  },
                  initialValue: 0,
                  in: { $add: ["$$value", "$$this.count"] }
                }
              },
              toolCallCount: 1,
              userCount: {
                $size: {
                  $filter: {
                    input: { $reduce: { input: "$uniqueUsers", initialValue: [], in: { $setUnion: ["$$value", "$$this"] } } },
                    as: "user",
                    cond: { $ne: ["$$user", null] }
                  }
                }
              }
            }
          }
        ]
      }
    },
    // Combine the results
    {
      $project: {
        combined: {
          $map: {
            input: "$allTime",
            as: "allTimeStats",
            in: {
              _id: "$$allTimeStats._id",
              threadCount: "$$allTimeStats.threadCount",
              userMessageCount: "$$allTimeStats.userMessageCount",
              assistantMessageCount: "$$allTimeStats.assistantMessageCount",
              toolCallCount: "$$allTimeStats.toolCallCount",
              userCount: "$$allTimeStats.userCount",
              // Add 7-day stats
              threadCount_7d: {
                $ifNull: [
                  {
                    $let: {
                      vars: {
                        matchedDoc: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$last7Days",
                                as: "recent",
                                cond: { $eq: ["$$recent._id", "$$allTimeStats._id"] }
                              }
                            },
                            0
                          ]
                        }
                      },
                      in: "$$matchedDoc.threadCount"
                    }
                  },
                  0
                ]
              },
              userMessageCount_7d: {
                $ifNull: [
                  {
                    $let: {
                      vars: {
                        matchedDoc: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$last7Days",
                                as: "recent",
                                cond: { $eq: ["$$recent._id", "$$allTimeStats._id"] }
                              }
                            },
                            0
                          ]
                        }
                      },
                      in: "$$matchedDoc.userMessageCount"
                    }
                  },
                  0
                ]
              },
              assistantMessageCount_7d: {
                $ifNull: [
                  {
                    $let: {
                      vars: {
                        matchedDoc: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$last7Days",
                                as: "recent",
                                cond: { $eq: ["$$recent._id", "$$allTimeStats._id"] }
                              }
                            },
                            0
                          ]
                        }
                      },
                      in: "$$matchedDoc.assistantMessageCount"
                    }
                  },
                  0
                ]
              },
              toolCallCount_7d: {
                $ifNull: [
                  {
                    $let: {
                      vars: {
                        matchedDoc: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$last7Days",
                                as: "recent",
                                cond: { $eq: ["$$recent._id", "$$allTimeStats._id"] }
                              }
                            },
                            0
                          ]
                        }
                      },
                      in: "$$matchedDoc.toolCallCount"
                    }
                  },
                  0
                ]
              },
              userCount_7d: {
                $ifNull: [
                  {
                    $let: {
                      vars: {
                        matchedDoc: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$last7Days",
                                as: "recent",
                                cond: { $eq: ["$$recent._id", "$$allTimeStats._id"] }
                              }
                            },
                            0
                          ]
                        }
                      },
                      in: "$$matchedDoc.userCount"
                    }
                  },
                  0
                ]
              }
            }
          }
        }
      }
    },
    { $unwind: "$combined" },
    { $replaceRoot: { newRoot: "$combined" } },
  ]).toArray()

  // Update each agent with their statistics
  for (const stat of agentStats) {
    if (!stat._id) continue

    await agentCollection.updateOne(
      { _id: stat._id },
      {
        $set: {
          'stats.userCount': stat.userCount,
          'stats.userCount_7d': stat.userCount_7d,
          'stats.threadCount': stat.threadCount,
          'stats.threadCount_7d': stat.threadCount_7d,
          'stats.userMessageCount': stat.userMessageCount,
          'stats.userMessageCount_7d': stat.userMessageCount_7d,
          'stats.assistantMessageCount': stat.assistantMessageCount,
          'stats.assistantMessageCount_7d': stat.assistantMessageCount_7d,
          'stats.toolCallCount': stat.toolCallCount,
          'stats.toolCallCount_7d': stat.toolCallCount_7d,
          'stats.lastUpdated': new Date()
        }
      }
    )
  }

  // Initialize stats for agents that don't have any activity
  await agentCollection.updateMany(
    { stats: { $exists: false } },
    {
      $set: {
        stats: {
          userCount: 0,
          userCount_7d: 0,
          threadCount: 0,
          threadCount_7d: 0,
          userMessageCount: 0,
          userMessageCount_7d: 0,
          assistantMessageCount: 0,
          assistantMessageCount_7d: 0,
          toolCallCount: 0,
          toolCallCount_7d: 0,
          lastUpdated: new Date()
        }
      }
    }
  )

  console.log(`Updated statistics for ${agentStats.length} agents at ${new Date().toISOString()}`)

  return {
    agents_with_stats: agentStats.length,
  }
}