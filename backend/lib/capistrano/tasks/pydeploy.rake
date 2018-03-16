desc "Create a venv for the application and install its packages"
namespace :deploy do
  task :populate_venv do
    on roles(:app) do
      within release_path do
        execute *%w[python3 -mvenv pyenv]
        execute *%w[pyenv/bin/pip install --upgrade pip]
        execute *%w[pyenv/bin/pip install -r Packages]
        if fetch(:deploy_uwsgi, false)
          execute *%w[pyenv/bin/pip install uwsgi]
        end
      end
    end
  end
  before :updated, :populate_venv
  
  task :reload_systemd_service do
    next unless service_name = fetch(:systemd_service, nil)
    
    on roles(:app) do
      within shared_path do
        execute *%w[sudo systemctl reload] + [service_name]
      end
    end
  end
  after :published, :reload_systemd_service
end
