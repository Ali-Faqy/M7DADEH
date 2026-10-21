import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './store'
import { ToastProvider } from './ui'
import DemoBar from './DemoBar'
import AdminLayout from './admin/AdminLayout'
import Dashboard from './admin/Dashboard'
import { ProjectDetail, ProjectsList } from './admin/Projects'
import { OrderDetail, OrdersList } from './admin/Orders'
import StagePage from './admin/StagePages'
import Returns from './admin/Returns'
import Employees from './admin/Employees'
import Reports from './admin/Reports'
import { MyTasks, TaskDetail, TaskFinish, TaskNote, TaskPhoto, TaskProblem, TaskWork, WorkerLayout } from './worker/WorkerApp'
import { CustomerDelivery, CustomerHome, CustomerLayout, CustomerMessage, CustomerPhotos, CustomerProject, ProjectRoute } from './customer/CustomerApp'

function Shell() {
  return <div className="h-full flex flex-col"><DemoBar /><div className="flex-1 min-h-0"><Outlet /></div></div>
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route element={<Shell />}>
              <Route path="/" element={<Navigate to="/admin" replace />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="projects" element={<ProjectsList />} />
                <Route path="projects/:id" element={<ProjectDetail />} />
                <Route path="orders" element={<OrdersList />} />
                <Route path="orders/:id" element={<OrderDetail />} />
                <Route path="survey" element={<StagePage stage={0} />} />
                <Route path="measurements" element={<StagePage stage={2} />} />
                <Route path="manufacturing" element={<StagePage stage={3} />} />
                <Route path="transport" element={<StagePage stage={4} />} />
                <Route path="quality" element={<StagePage stage={5} />} />
                <Route path="installation" element={<StagePage stage={6} />} />
                <Route path="delivery" element={<StagePage stage={7} />} />
                <Route path="returns" element={<Returns />} />
                <Route path="employees" element={<Employees />} />
                <Route path="reports" element={<Reports />} />
              </Route>
              <Route path="/worker" element={<WorkerLayout />}>
                <Route index element={<MyTasks />} />
                <Route path="task/:id" element={<TaskDetail />} />
                <Route path="task/:id/work" element={<TaskWork />} />
                <Route path="task/:id/photo" element={<TaskPhoto />} />
                <Route path="task/:id/note" element={<TaskNote />} />
                <Route path="task/:id/problem" element={<TaskProblem />} />
                <Route path="task/:id/finish" element={<TaskFinish />} />
              </Route>
              <Route path="/customer" element={<CustomerLayout />}>
                <Route index element={<CustomerHome />} />
                <Route path="project/:id" element={<ProjectRoute />}>
                  <Route index element={<CustomerProject />} />
                  <Route path="photos" element={<CustomerPhotos />} />
                  <Route path="message" element={<CustomerMessage />} />
                  <Route path="delivery" element={<CustomerDelivery />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Routes>
        </HashRouter>
      </ToastProvider>
    </StoreProvider>
  )
}
