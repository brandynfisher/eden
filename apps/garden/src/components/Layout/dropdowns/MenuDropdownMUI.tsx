import {
  Button,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material'
import React, { ReactNode } from 'react'

export type MenuDropdownItem = {
  key: string
  text?: string
  icon?: ReactNode
  suffix?: string | ReactNode
  onClick?: () => void
  render?: ReactNode
}

const MenuDropdownMUI = ({
  buttonLabel,
  menuItems,
}: {
  buttonLabel: string | ReactNode
  menuItems: MenuDropdownItem[]
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | Element>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <Button
        // id="basic-button"
        // aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
      >
        {buttonLabel}
      </Button>
      <Menu
        // id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        // MenuListProps={{
        //   'aria-labelledby': 'basic-button',
        // }}
        // sx={{ width: 320, maxWidth: '100%' }}
        // className="w-[320px] max-w-full"
      >
        {menuItems.map(item => (
          <MenuItem
            key={item.key}
            onClick={item.onClick ? item.onClick : undefined}
            className="!border-solid !border-0 !border-b !border-gray-600 last:!border-0 min-w-[265px] max-w-full pr-0"
          >
            {item.render ? (
              item.render
            ) : (
              <>
                {item.icon ? <ListItemIcon>{item.icon}</ListItemIcon> : null}

                {item.text ? <ListItemText>{item.text}</ListItemText> : null}

                {item.suffix ? (
                  <Typography variant="body2" color="text.secondary">
                    {item.suffix}
                  </Typography>
                ) : null}
              </>
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default MenuDropdownMUI
