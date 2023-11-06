import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'

const ResultTools = () => {
  return (
    <div className="mt-4 flex gap-2 flex-wrap w-full justify-end">
      <div className="flex gap-2 items-center">
        {/*<AspectRatio fontSize="medium"/>*/}
        <ButtonGroup>
          <Button size="small">2x</Button>
          <Button size="small">4x</Button>
        </ButtonGroup>
      </div>
      {/*<div className="flex gap-2 items-center">*/}
      {/*  Variation*/}
      {/*  <ButtonGroup>*/}
      {/*    <Button>*/}
      {/*      MAGIC*/}
      {/*    </Button>*/}
      {/*  </ButtonGroup>*/}
      {/*</div>*/}
    </div>
  )
}

export default ResultTools
