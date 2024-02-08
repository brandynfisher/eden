import { GatedActions, useSubscriptionGate } from '@/hooks/useSubscriptionGate'
import { useTaskCost } from '@/hooks/useTaskCost'
import { handleAxiosError } from '@/lib/fetcher'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { UserContext } from '@/providers/UserProvider'
import { Creation, Generator, Task } from '@edenlabs/eden-sdk'
import AnimationOutlined from '@mui/icons-material/AnimationOutlined'
import PhotoSizeSelectLarge from '@mui/icons-material/PhotoSizeSelectLarge'
import WorkspacePremium from '@mui/icons-material/WorkspacePremium'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { App } from 'antd'
import axios from 'axios'
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const MannaCostDisplay = ({
  generatorName,
  config,
}: {
  generatorName: Generator['generatorName']
  config: Task['config']
}) => {
  const { getTaskCost } = useTaskCost()
  const [taskCost, setTaskCost] = useState(0)

  useEffect(() => {
    const { cost } = getTaskCost(generatorName, config)
    setTaskCost(cost)
  }, [getTaskCost, generatorName, config])

  return (
    <span className="text-xs text-gray-400 font-mono ml-auto">
      <>{taskCost} Manna</>
    </span>
  )
}

export const UpscaleImageMenu = ({ imageUri }: { imageUri: string }) => {
  const { message } = App.useApp()
  const { maybeAuthenticate, refetchMe } = useContext(UserContext)
  const { setActiveTaskId, refetchTasks } = useContext(
    CreationNotificationContext,
  )
  const { isAllowed: is4kUpscaleAllowed } = useSubscriptionGate(
    GatedActions.UpscaleImage4k,
  )

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const [isSubmittingTask, setIsSubmittingTask] = useState(false)

  const generatorName = useMemo(() => {
    return 'upscale'
  }, [])

  const baseConfig = useMemo(() => {
    return {
      input_images: [imageUri],
    }
  }, [imageUri])

  const handleTaskCreate = useCallback(
    async (
      generatorName: Generator['generatorName'],
      config: Task['config'],
    ) => {
      setIsSubmittingTask(true)

      if (!(await maybeAuthenticate())) {
        setIsSubmittingTask(false)
        return
      }

      message.destroy()

      try {
        const response = await axios.post('/api/tasks/create', {
          generatorName,
          config,
        })
        refetchTasks && refetchTasks()
        message.success('Task "Upscale" created!')
        const { taskId } = response.data
        setActiveTaskId && setActiveTaskId(taskId)
        refetchMe()
      } catch (error) {
        handleAxiosError(error, message)
      } finally {
        setIsSubmittingTask(false)
        handleClose()
      }
    },
    [maybeAuthenticate, refetchMe, refetchTasks, setActiveTaskId, message],
  )

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleItemClick = useCallback(
    async (resolution: number) => {
      await handleTaskCreate(generatorName, {
        ...baseConfig,
        width: resolution,
        height: resolution,
      })
    },
    [baseConfig, generatorName, handleTaskCreate],
  )

  return (
    <div>
      <Button
        variant="outlined"
        size="small"
        className="flex items-center leading-snug"
        id="upscale-positioned-button"
        aria-controls={open ? 'upscale-positioned-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleOpen}
      >
        <div className="h-6 text-xs flex gap-1 items-center">
          <PhotoSizeSelectLarge fontSize="small" />
          <div>Upscale</div>
        </div>
      </Button>
      <Menu
        id="upscale-positioned-menu"
        aria-labelledby="upscale-positioned-button"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        title={'Upscale to...'}
      >
        <MenuItem className="text-xs" disabled={true}>
          Upscale Resolution
        </MenuItem>
        <MenuItem
          onClick={() => handleItemClick(2048)}
          className="flex gap-1"
          disabled={isSubmittingTask}
        >
          2k
          <MannaCostDisplay
            generatorName={generatorName}
            config={{ ...baseConfig, width: 2048, height: 2048 }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => handleItemClick(3072)}
          className="flex gap-1"
          disabled={isSubmittingTask}
        >
          {!is4kUpscaleAllowed ? (
            <WorkspacePremium fontSize="small" className="text-orange-300" />
          ) : null}
          4k
          <MannaCostDisplay
            generatorName={generatorName}
            config={{ ...baseConfig, width: 3072, height: 3072 }}
          />
        </MenuItem>
      </Menu>
    </div>
  )
}

export const AnimateImageMenu = ({ imageUri }: { imageUri: string }) => {
  const { message } = App.useApp()
  const { maybeAuthenticate, refetchMe } = useContext(UserContext)
  const { setActiveTaskId, refetchTasks } = useContext(
    CreationNotificationContext,
  )
  const { isAllowed: isAnimateLongAllowed } = useSubscriptionGate(
    GatedActions.AnimateImageLong,
  )

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState<boolean>(false)
  const [isSubmittingTask, setIsSubmittingTask] = useState(false)

  const generatorName = useMemo(() => {
    return 'img2vid'
  }, [])

  const baseConfig = useMemo(() => {
    return {
      input_images: [imageUri],
    }
  }, [imageUri])

  const handleTaskCreate = useCallback(
    async (
      generatorName: Generator['generatorName'],
      config: Task['config'],
    ) => {
      setIsSubmittingTask(true)

      if (!(await maybeAuthenticate())) {
        setIsSubmittingTask(false)
        return
      }

      message.destroy()

      try {
        const response = await axios.post('/api/tasks/create', {
          generatorName,
          config,
        })
        refetchTasks && refetchTasks()
        message.success('Task "img2vid" created!')
        const { taskId } = response.data
        setActiveTaskId && setActiveTaskId(taskId)
        refetchMe()
      } catch (error) {
        handleAxiosError(error, message)
      } finally {
        setIsSubmittingTask(false)
        handleClose()
      }
    },
    [refetchTasks, refetchMe, maybeAuthenticate, message, setActiveTaskId],
  )

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
    setMenuOpen(true)
  }

  const handleClose = () => {
    setMenuOpen(false)
  }

  const handleItemClick = useCallback(
    async (durationInFrames: number) => {
      await handleTaskCreate(generatorName, {
        ...baseConfig,
        n_frames: durationInFrames,
      })
    },
    [generatorName, baseConfig, handleTaskCreate],
  )

  return (
    <div>
      <Button
        variant="outlined"
        size="small"
        className="flex items-center leading-snug"
        id="animate-positioned-button"
        aria-controls={anchorEl ? 'animate-positioned-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={anchorEl ? 'true' : undefined}
        onClick={handleOpen}
      >
        <div className="h-6 text-xs flex gap-1 items-center">
          <AnimationOutlined fontSize="small" />
          <div>Animate</div>
        </div>
      </Button>
      <Menu
        id="animate-positioned-menu"
        aria-labelledby="animate-positioned-button"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleClose}
        title={'Animation duration...'}
      >
        <MenuItem className="text-xs" disabled={true}>
          Animation Duration
        </MenuItem>
        <MenuItem
          onClick={() => handleItemClick(24)}
          className="flex gap-1 justify-between"
          disabled={isSubmittingTask}
        >
          4 s
          <MannaCostDisplay
            generatorName={generatorName}
            config={{ ...baseConfig, n_frames: 24 }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => handleItemClick(48)}
          className="flex gap-1 justify-between"
          disabled={isSubmittingTask}
        >
          8 s
          <MannaCostDisplay
            generatorName={generatorName}
            config={{ ...baseConfig, n_frames: 48 }}
          />
        </MenuItem>
        <MenuItem
          onClick={() => handleItemClick(64)}
          className="flex gap-1 justify-between"
          disabled={isSubmittingTask}
        >
          {!isAnimateLongAllowed ? (
            <WorkspacePremium fontSize="small" className="text-orange-300" />
          ) : null}
          12 s
          <MannaCostDisplay
            generatorName={generatorName}
            config={{ ...baseConfig, n_frames: 64 }}
          />
        </MenuItem>
      </Menu>
    </div>
  )
}

const CreationImageActions = ({ creation }: { creation: Creation }) => {
  return (
    <div>
      <div className="text-gray-400 text-xs mb-2">Actions</div>
      <div className="flex gap-2">
        <UpscaleImageMenu imageUri={creation.uri} />
        <AnimateImageMenu imageUri={creation.uri} />
        {/*<Button variant='outlined' size='small' className='flex items-center leading-snug'>*/}
        {/*  <div className='h-6 text-xs flex items-center cap'>Recreate</div>*/}
        {/*</Button>*/}
      </div>
    </div>
  )
}

export default CreationImageActions
