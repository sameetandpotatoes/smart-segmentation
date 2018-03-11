desc "Create a venv for the application and install its packages"
namespace :deploy do
  task :populate_venv do
    on roles(:app) do
      within release_path do
        execute *%w[python3 -mvenv pyenv]
        execute *%w[pyenv/bin/pip install --upgrade pip]
        execute *%w[pyenv/bin/pip install -r Packages]
      end
    end
  end
  after :published, :populate_venv
end
