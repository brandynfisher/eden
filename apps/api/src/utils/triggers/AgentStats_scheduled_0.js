exports = async function () {
  // eslint-disable-next-line no-undef
  const mongodb = context.services.get("Cluster1");  // or your actual cluster name
  if (!mongodb) throw new Error("Could not access MongoDB cluster");
  
  const db = mongodb.db("eden-stg");
  if (!db) throw new Error("Could not access database eden-stg");

  const agentCollection = db.collection("users3");
  const threadCollection = db.collection("threads3");

  const agentStats = await threadCollection.aggregate([
    {
      $match: {
        deleted: { $ne: true }  // Exclude soft-deleted threads
      }
    },
    {
      $facet: {
        // Count threads per agent
        threadCounts: [
          {
            $group: {
              _id: "$agent",
              threadCount: { $sum: 1 }
            }
          }
        ],
        // Count messages by role, tool calls, and unique users per agent
        messageCounts: [
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
            input: "$threadCounts",
            as: "thread",
            in: {
              _id: "$$thread._id",
              threadCount: "$$thread.threadCount",
              userMessageCount: {
                $let: {
                  vars: {
                    msgStats: {
                      $filter: {
                        input: "$messageCounts",
                        as: "msg",
                        cond: { $eq: ["$$msg._id", "$$thread._id"] }
                      }
                    }
                  },
                  in: {
                    $ifNull: [{ $arrayElemAt: ["$$msgStats.userMessageCount", 0] }, 0]
                  }
                }
              },
              assistantMessageCount: {
                $let: {
                  vars: {
                    msgStats: {
                      $filter: {
                        input: "$messageCounts",
                        as: "msg",
                        cond: { $eq: ["$$msg._id", "$$thread._id"] }
                      }
                    }
                  },
                  in: {
                    $ifNull: [{ $arrayElemAt: ["$$msgStats.assistantMessageCount", 0] }, 0]
                  }
                }
              },
              toolCallCount: {
                $let: {
                  vars: {
                    msgStats: {
                      $filter: {
                        input: "$messageCounts",
                        as: "msg",
                        cond: { $eq: ["$$msg._id", "$$thread._id"] }
                      }
                    }
                  },
                  in: {
                    $ifNull: [{ $arrayElemAt: ["$$msgStats.toolCallCount", 0] }, 0]
                  }
                }
              },
              userCount: {
                $let: {
                  vars: {
                    msgStats: {
                      $filter: {
                        input: "$messageCounts",
                        as: "msg",
                        cond: { $eq: ["$$msg._id", "$$thread._id"] }
                      }
                    }
                  },
                  in: {
                    $ifNull: [{ $arrayElemAt: ["$$msgStats.userCount", 0] }, 0]
                  }
                }
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
          'stats.threadCount': stat.threadCount,
          'stats.userMessageCount': stat.userMessageCount,
          'stats.assistantMessageCount': stat.assistantMessageCount,
          'stats.toolCallCount': stat.toolCallCount,
          'stats.userCount': stat.userCount,
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
          threadCount: 0,
          userMessageCount: 0,
          assistantMessageCount: 0,
          toolCallCount: 0,
          userCount: 0,
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