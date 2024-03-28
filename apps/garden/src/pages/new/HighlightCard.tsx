import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { Button } from '@mui/material'
import Image from 'next/image'
import React from 'react'

const HighlightCard = () => {
  return (
    <div className="mb-2">
      <div className="relative grid grid-cols-2 h-64">
        <div className="relative overflow-hidden">
          <Image
            src={
              'https://edenartlab-stage-data.s3.us-east-1.amazonaws.com/ba44da70d2caa1dd8bd909c80e9f5f5e91fe08bab50e387706eac98db768e9cb.jpg'
            }
            alt={'Highlight concept'}
            // width={0}
            // height={0}
            fill={true}
            className="max-w-2xl object-cover"
          />
        </div>
        <div className="flex flex-col justify-between p-4 bg-gray-400 dark:bg-gray-800">
          <div>
            <h3>Title</h3>
            <div>description</div>
            <CreatorProfileLink
              creatorName={'laub-local'}
              creatorId={'651c6e895447983fa2697453'}
              creatorImage={
                'https://edenartlab-stage-data.s3.us-east-1.amazonaws.com/ed8752fe48844466a6ecd2ccdcbcb4ea80e10d32258387bb7697499e427f32eb.png'
              }
            />
          </div>
          <div className="flex gap-4">
            <Button variant="outlined">Action 1</Button>
            <Button variant="outlined">Action 2</Button>
          </div>
        </div>
      </div>
      {/*<Card className="md:flex">*/}
      {/*  <CardMedia*/}
      {/*    component="img"*/}
      {/*    alt="Yosemite National Park"*/}
      {/*    image=""*/}
      {/*  />*/}
      {/*  /!* @todo: get rid of MUI stylings/layouts *!/*/}
      {/*  <Stack direction="row" alignItems="center" spacing={3} p={2} useFlexGap>*/}
      {/*    <Stack direction="column" spacing={0.5} useFlexGap>*/}
      {/*      <Typography>Yosemite National Park, California, USA</Typography>*/}
      {/*      <Stack direction="row" spacing={1} useFlexGap>*/}
      {/*        <Chip*/}
      {/*          size="small"*/}
      {/*          label={'Active'}*/}
      {/*          // label={active ? 'Active' : 'Inactive'}*/}
      {/*          color={'success'}*/}
      {/*          // color={active ? 'success' : 'default'}*/}
      {/*        />*/}
      {/*        /!*<Rating defaultValue={1} size="small" />*!/*/}
      {/*      </Stack>*/}
      {/*    </Stack>*/}
      {/*    /!*<Switch checked={active} />*!/*/}
      {/*  </Stack>*/}
      {/*</Card>*/}
    </div>
  )
}

export default HighlightCard
