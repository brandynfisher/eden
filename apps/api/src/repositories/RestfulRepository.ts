interface IRepository<T> {
  query(
    query?: object,
    options?: { page?: number; limit?: number; sort?: object },
  ): Promise<T>
  create(data: object): Promise<T>
  findOneBy(prop: string, value: string): Promise<T>
  findById(id: string): Promise<T>
  findByIdAndUpdate(id: string, data: object, options?: object): Promise<T>
  deleteById(id: string): Promise<void>
}

class RestfulRepository<T> implements IRepository<T> {
  constructor(private model: any) {
    // The 'any' type is used here since the 'model' type is not specified in the provided code.
    // Replace it with the appropriate type for your model if possible.
    this.model = model
  }

  async query(
    query: object = {},
    options: { page?: number; limit?: number; sort?: object } = {},
  ): Promise<T> {
    const labels = {
      totalDocs: 'total',
      totalPages: 'pages',
    }

    return await this.model.paginate(query, {
      ...options,
      page: options.page ?? 1,
      limit: options.limit ?? 100,
      sort: options.sort ?? { _id: 1 },
      customLabels: labels,
    })
  }

  async create(data: object): Promise<T> {
    return await this.model.create(data)
  }

  async findOneBy(prop: string, value: string): Promise<T> {
    if (!prop || !value) {
      throw new Error('Property and value must be specified.')
    }

    return await this.model.findOne({ [prop]: value })
  }

  async findById(id: string): Promise<T> {
    return await this.findOneBy('_id', id)
  }

  async findByIdAndUpdate(
    id: string,
    data: object,
    options: object = {},
  ): Promise<T> {
    const obj = await this.model.findOneAndUpdate({ _id: id }, data, options)
    return obj.save()
  }

  async deleteById(id: string): Promise<void> {
    return await this.model.deleteById(id)
  }
}

export default RestfulRepository
