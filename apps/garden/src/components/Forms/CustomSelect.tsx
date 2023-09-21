import { CONFIG } from '@/lib/config'
import { Select, SelectProps } from 'antd'
import Image from 'next/image'
import { DefaultOptionType } from 'rc-select/lib/Select'

type ExtendedOptionType = DefaultOptionType & { thumbnail?: string }

const filterOption = (
  searchValue: string,
  option: ExtendedOptionType | undefined,
) => {
  return (String(option?.searchableText) ?? '')
    .toLowerCase()
    .includes(searchValue.toLowerCase())
}

const filterSort = (
  optionA: ExtendedOptionType,
  optionB: ExtendedOptionType,
) => {
  return (String(optionA?.searchableText) ?? '')
    .toLowerCase()
    .localeCompare((String(optionB?.searchableText) ?? '').toLowerCase())
}

const CustomOption = ({
  label,
  thumbnail,
  description,
}: {
  label: string
  thumbnail: string
  description: string
}) => {
  return (
    <div className="flex gap-4">
      {thumbnail ? (
        <Image
          width={40}
          height={40}
          src={thumbnail || `${CONFIG.NEXT_PUBLIC_HOST}/placeholder.png`}
          alt={label || ''}
          className="rounded"
        />
      ) : null}
      <div>
        <div className="text-gray-500">{label}</div>
        <div>{description}</div>
      </div>
    </div>
  )
}

type Grouped<T> = {
  [key: string]: T[]
}

type GenericArray<T> = T[]

const groupBy = (
  input: GenericArray<DefaultOptionType>,
): Grouped<DefaultOptionType> => {
  const grouped = input.reduce(
    (acc: Grouped<DefaultOptionType>, currentValue: DefaultOptionType) => {
      const [userName, conceptName] = (String(currentValue.label) ?? '').split(
        ':',
      )
      if (!acc[userName]) {
        acc[userName] = []
      }
      acc[userName].push({ ...currentValue, conceptName })
      return acc
    },
    {},
  )

  return grouped
}

const SelectCustom = ({
  options,
  ...rest
}: SelectProps & { options: DefaultOptionType[] }) => {
  const groupedKeys = groupBy(options || [])
  const groupedOptions = Object.entries(groupedKeys).map(group => {
    return {
      label: group[0],
      options: group[1].map(option => ({
        label: (
          <CustomOption
            label={`${option.conceptName} - ${option.checkpoint}`}
            thumbnail={option.thumbnail || ''}
            description={option.conceptName}
          />
        ),
        value: option.value,
        searchableText: `${group[0]} ${option.conceptName}`,
      })),
    }
  })

  return (
    <Select
      {...rest}
      size="large"
      allowClear
      showSearch
      filterOption={filterOption}
      filterSort={filterSort}
      optionLabelProp={'label'}
      options={groupedOptions}
    ></Select>
  )
}

export default SelectCustom
