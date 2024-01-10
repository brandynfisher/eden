import {
  GeneratorsGetArguments,
  GeneratorsListArguments,
} from '@edenlabs/eden-sdk'
import { FastifyReply, FastifyRequest } from 'fastify'

import { Generator, GeneratorVersionSchema } from '../models/Generator'
import GeneratorRepository from '../repositories/GeneratorRepository'

export const getGenerator = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { generatorName } = request.params as GeneratorsGetArguments
  const generator = await Generator.findOne({ generatorName })

  if (!generator) {
    return reply.status(404).send({
      message: 'Generator not found',
    })
  }

  const generatorObj = {
    generatorName: generator.generatorName,
    output: generator.output,
    description: generator.description,
    defaultVersionId: generator.defaultVersionId,
    versions: generator.versions.filter(
      (version: GeneratorVersionSchema) =>
        version.versionId === generator.defaultVersionId,
    ),
  }

  return reply.status(200).send({ generator: generatorObj })
}

export const listGenerators = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const { limit, page, sort } = request.query as GeneratorsListArguments

  const generatorRepository = new GeneratorRepository(Generator)
  const generators = await generatorRepository.query(
    {},
    {
      limit,
      page,
      sort,
    },
  )

  const response = {
    ...generators,
    docs: generators.docs.map(generator => ({
      generatorName: generator.generatorName,
      output: generator.output,
      description: generator.description,
      defaultVersionId: generator.defaultVersionId,
      versions: generator.versions.filter(
        (version: GeneratorVersionSchema) =>
          version.versionId === generator.defaultVersionId,
      )[-1],
    })),
  }

  return reply.status(200).send(response)
}

// export const registerGenerator = async (request: FastifyRequest, reply: FastifyReply) => {
//   const { generatorName, provider, address, versionId, parameters, creationAttributes } = request.body as GeneratorRegisterRequestBody;

//   const generatorVersion: GeneratorVersionSchema = {
//     provider,
//     address,
//     versionId,
//     parameters,
//     creationAttributes,
//     isDeprecated: false,
//     createdAt: new Date(),
//   }

//   const generator = await Generator.findOne({
//     generatorName,
//   });

//   if (generator) {
//     await Generator.updateOne({
//       generatorName,
//     }, {
//       $push: {
//         versions: generatorVersion,
//       },
//     });
//     return reply.status(200).send({
//       generatorName,
//       versionId,
//     });
//   } else {
//     // Doesn't exist, create new generator
//     const generatorDoc = new Generator({
//       generatorName,
//       versions: [generatorVersion],
//     });
//     await generatorDoc.save();
//     return reply.status(200).send({
//       generator: generatorDoc
//     });
//   }
// }

// export const deprecateGenerator = async (request: FastifyRequest, reply: FastifyReply) => {
//   const { generatorName, versionId } = request.body as GeneratorDeprecateRequestBody

//   const generator = await Generator.findOne({
//     generatorName,
//   });

//   if (!generator) {
//     return reply.status(404).send({
//       message: "Generator not found",
//     });
//   }

//   const versionIndex = generator.versions.findIndex((v: GeneratorVersionSchema) => v.versionId === versionId);

//   if (versionIndex === -1) {
//     return reply.status(404).send({
//       message: "Generator version not found",
//     });
//   }

//   await generator.updateOne({
//     $set: {
//       [`versions.${versionIndex}.isDeprecated`]: true,
//     },
//   });

//   return reply.status(200).send({
//     generatorName,
//     versionId,
//   });
// }
